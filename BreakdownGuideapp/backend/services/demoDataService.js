/**
 * Demo Data Seeding Service
 *
 * Seeds realistic breakdown and activity data for the demo account.
 * All data is tagged with supervisor_badge='DEMO01' and breakdown IDs
 * prefixed with 'DEMO-' for complete isolation from production data.
 */

import { query } from '../utils/queryHelpers.js';
import { DEMO_DEPOTS } from '../data/demoDepots.js';
import DEMO_DIVERSION from '../data/demoDiversion.js';

// Fictional depot shorthands, so the breakdown/engineer/replacement fixtures
// below read clearly (matches data/demoDepots.js exactly - the canonical table).
const [NGT, EFD, HBS, WMR, SBK, HCR] = DEMO_DEPOTS;

const DEMO_BADGE = 'DEMO01';
const DEMO_SUPERVISOR_NAME = 'Demo User';
const DEMO_SUPERVISOR_ID = 'demo-0000-0000-0000-000000000001';

/**
 * Generate a MySQL-formatted datetime string offset from now
 * @param {number} hoursAgo - Hours before now
 * @param {number} minutesAgo - Additional minutes before now
 * @returns {string} MySQL datetime string
 */
function timeAgo(hoursAgo, minutesAgo = 0) {
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo);
  d.setMinutes(d.getMinutes() - minutesAgo);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Add minutes to a MySQL-formatted datetime string (as produced by timeAgo()).
 * Used to derive a realistic follow-on event time (e.g. "assessment completed
 * 3 minutes after the breakdown was reported") without drifting from `now`.
 */
function minutesAfter(mysqlDatetimeStr, minutes) {
  const d = new Date(mysqlDatetimeStr.replace(' ', 'T') + 'Z');
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Resolved timestamps for the two live demo breakdowns that are already
// wrapped up (DEMO-010, DEMO-011). Shared between the breakdown-enrichment
// step and the activity feed so the "resolved" activity lines up exactly
// with the breakdown's own resolved_at. Computed per call (i.e. per seed) —
// a module-level constant froze these at server start, so after a day of
// uptime they fell BEFORE the freshly-seeded created_at (negative response
// times, e.g. "-772m" in the coverage bar).
const resolvedAtFor = (breakdownId) =>
  ({ 'DEMO-010': timeAgo(4, 30), 'DEMO-011': timeAgo(6, 0) })[breakdownId];

// Engineer name -> badge for the demo engineers (kept in sync with the demo
// engineer list further down)
const DEMO_ENGINEER_BADGES = {
  'Mark Robson': 'DEMO-E01', 'Dave Hedley': 'DEMO-E02',
  'Paul Charlton': 'DEMO-E03', 'Stephen Liddle': 'DEMO-E04',
};

/**
 * The 14 demo breakdowns covering all wizard types, severities, statuses, and depots
 */
function getDemoBreakdowns() {
  return [
    // 1. Critical - Active - Brakes
    {
      breakdown_id: 'DEMO-001',
      fleet_no: '6301',
      depot: NGT.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Northgate Interchange, Stand B',
      location_lat: 55.0090,
      location_lng: -1.6180,
      issue_category: 'Brakes',
      status: 'active',
      severity: 'STOP',
      wizard_decision: 'STOP',
      wizard_type: 'brakes',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: '21', description: 'Low brake pressure warning illuminated. Air pressure dropping below 5 bar. Vehicle unsafe to continue.' }),
      created_at: timeAgo(0, 25)
    },
    // 2. High - In Progress - Steering
    {
      breakdown_id: 'DEMO-002',
      fleet_no: '6078',
      depot: NGT.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Northgate Ring Road, Bay 3',
      location_lat: 55.0300,
      location_lng: -1.6480,
      issue_category: 'Steering',
      status: 'in_progress',
      severity: 'STOP',
      wizard_decision: 'STOP',
      wizard_type: 'steering',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: '56', description: 'Power steering pump whining. Heavy steering at low speed. Engineer dispatched.' }),
      created_at: timeAgo(1, 10),
      // Engineer en route - live ETA countdown (dispatched 6 min ago, 18 min ETA -> ~12 min remaining)
      engineer_name: 'Mark Robson',
      engineer_dispatched_at: timeAgo(0, 6),
      engineer_eta_minutes: 18
    },
    // 3. Medium - Dispatched - Doors
    {
      breakdown_id: 'DEMO-003',
      fleet_no: '5437',
      depot: EFD.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Eastfield Retail Park, Stand 7',
      location_lat: 55.0010,
      location_lng: -1.4450,
      issue_category: 'Doors',
      status: 'dispatched',
      severity: 'AMBER',
      wizard_decision: 'AMBER',
      wizard_type: 'doors',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: '10', description: 'Rear door not sealing properly. Sensitive edge activating intermittently. Can continue with caution.' }),
      created_at: timeAgo(2, 5),
      // Engineer en route - live ETA countdown (dispatched 9 min ago, 12 min ETA -> ~3 min remaining, urgent)
      engineer_name: 'Dave Hedley',
      engineer_dispatched_at: timeAgo(0, 9),
      engineer_eta_minutes: 12
    },
    // 4. Low - Received - Buzzers
    {
      breakdown_id: 'DEMO-004',
      fleet_no: '5292',
      depot: HBS.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Harbourside Interchange',
      location_lat: 54.9040,
      location_lng: -1.3900,
      issue_category: 'Buzzers/Bell',
      status: 'received',
      severity: 'CONTINUE',
      wizard_decision: 'CONTINUE',
      wizard_type: 'buzzers',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: '1', description: 'Bell push on upper deck near rear not working. Other bell pushes functional. Advise driver to continue in service.' }),
      created_at: timeAgo(2, 40)
    },
    // 5. Critical - Active - Overheating
    {
      breakdown_id: 'DEMO-005',
      fleet_no: '6145',
      depot: SBK.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Southbank Bus Station, Bay 1',
      location_lat: 54.8580,
      location_lng: -1.5770,
      issue_category: 'Overheating',
      status: 'active',
      severity: 'STOP',
      wizard_decision: 'STOP',
      wizard_type: 'overheating',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: 'X1', description: 'Temperature gauge in red. Steam visible from engine bay. Vehicle stopped immediately.' }),
      created_at: timeAgo(0, 45)
    },
    // 6. Medium - In Progress - Speedo
    {
      breakdown_id: 'DEMO-006',
      fleet_no: '5318',
      depot: HCR.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Hillcrest Bus Station',
      location_lat: 54.8690,
      location_lng: -1.8050,
      issue_category: 'Speedometer',
      status: 'in_progress',
      severity: 'AMBER',
      wizard_decision: 'AMBER',
      wizard_type: 'speedo',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: 'X45', description: 'Speedometer reading intermittently. Drops to zero then recovers. Driver aware.' }),
      created_at: timeAgo(3, 15)
    },
    // 7. High - Dispatched - Ramp
    {
      breakdown_id: 'DEMO-007',
      fleet_no: '6210',
      depot: NGT.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Northgate Interchange, Stand D',
      location_lat: 55.0120,
      location_lng: -1.6100,
      issue_category: 'Wheelchair Ramp',
      status: 'dispatched',
      severity: 'STOP',
      wizard_decision: 'STOP',
      wizard_type: 'ramp',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: '27', description: 'Wheelchair ramp will not deploy. Hydraulic motor not engaging. Cannot provide accessible service.' }),
      created_at: timeAgo(1, 30),
      // Engineer en route - live ETA countdown (dispatched 2 min ago, 22 min ETA -> ~20 min remaining)
      engineer_name: 'Paul Charlton',
      engineer_dispatched_at: timeAgo(0, 2),
      engineer_eta_minutes: 22
    },
    // 8. Low - Pending - Suspension
    {
      breakdown_id: 'DEMO-008',
      fleet_no: '5195',
      depot: EFD.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Eastfield Interchange, Stand A',
      location_lat: 54.9960,
      location_lng: -1.4700,
      issue_category: 'Suspension',
      status: 'pending',
      severity: 'AMBER',
      wizard_decision: 'AMBER',
      wizard_type: 'suspension',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: '35', description: 'Kneeling function not operating. Air suspension otherwise normal. Vehicle safe to continue.' }),
      created_at: timeAgo(4, 0)
    },
    // 9. Critical - Active - Puncture
    {
      breakdown_id: 'DEMO-009',
      fleet_no: '6089',
      depot: HBS.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Ring Road, near Harbourside Retail Park',
      location_lat: 54.8880,
      location_lng: -1.4200,
      issue_category: 'Puncture',
      status: 'active',
      severity: 'STOP',
      wizard_decision: 'STOP',
      wizard_type: 'puncture',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: '309', description: 'Nearside rear tyre flat. Vehicle pulled over safely. Passengers transferred to following service.' }),
      created_at: timeAgo(0, 15)
    },
    // 10. Medium - Resolved - Fuel
    {
      breakdown_id: 'DEMO-010',
      fleet_no: '5401',
      depot: WMR.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Westmoor Bus Station',
      location_lat: 54.9440,
      location_lng: -1.7560,
      issue_category: 'Fuel System',
      status: 'resolved',
      severity: 'AMBER',
      wizard_decision: 'AMBER',
      wizard_type: 'fuel',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: '684', description: 'Fuel gauge showing empty despite recent fill. Sensor fault confirmed. Vehicle returned to depot.' }),
      created_at: timeAgo(6, 0)
    },
    // 11. Low - Completed - Doors (second)
    {
      breakdown_id: 'DEMO-011',
      fleet_no: '5510',
      depot: SBK.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Southbank High Street',
      location_lat: 54.8480,
      location_lng: -1.5880,
      issue_category: 'Doors',
      status: 'completed',
      severity: 'CONTINUE',
      wizard_decision: 'CONTINUE',
      wizard_type: 'doors',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: '8A', description: 'Front door slow to open. Driver reports slight delay on button press. Continued in service.' }),
      created_at: timeAgo(7, 30)
    },
    // 12. High - In Progress - Brakes (second)
    {
      breakdown_id: 'DEMO-012',
      fleet_no: '6322',
      depot: EFD.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'A-road layby near Eastfield',
      location_lat: 55.0130,
      location_lng: -1.4900,
      issue_category: 'Brakes',
      status: 'in_progress',
      severity: 'STOP',
      wizard_decision: 'STOP',
      wizard_type: 'brakes',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: '21', description: 'Brake disc overheat smell reported. Handbrake not holding on gradient. Recovery required.' }),
      created_at: timeAgo(1, 50),
      // Engineer arrived on site - countdown stops, shows on-site status
      engineer_name: 'Stephen Liddle',
      engineer_dispatched_at: timeAgo(0, 40),
      engineer_eta_minutes: 15,
      engineer_on_site_at: timeAgo(0, 20)
    },
    // 13. Medium - Received - Overheating (second)
    {
      breakdown_id: 'DEMO-013',
      fleet_no: '5267',
      depot: HCR.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Hillcrest High Street',
      location_lat: 54.8810,
      location_lng: -1.8560,
      issue_category: 'Overheating',
      status: 'received',
      severity: 'AMBER',
      wizard_decision: 'AMBER',
      wizard_type: 'overheating',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: 'X30', description: 'Temperature rising above normal but not critical. Coolant level appears low. Monitoring situation.' }),
      created_at: timeAgo(3, 0)
    },
    // 14. Low - Active - Buzzers (second)
    {
      breakdown_id: 'DEMO-014',
      fleet_no: '5155',
      depot: HBS.name,
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Harbourside Ferry Terminal',
      location_lat: 54.9135,
      location_lng: -1.3740,
      issue_category: 'Buzzers/Bell',
      status: 'active',
      severity: 'CONTINUE',
      wizard_decision: 'CONTINUE',
      wizard_type: 'buzzers',
      breakdown_source: 'wizard',
      wizard_assessment_data: JSON.stringify({ route: '1', description: 'Stop request display not illuminating. Bell sounds correctly. Display fault only.' }),
      created_at: timeAgo(0, 50)
    }
  ];
}

/**
 * Historical (resolved) demo breakdowns spread over the last ~4 weeks. Gives the
 * analytics, trends, fleet-intelligence and mileage dashboards real depth without
 * cluttering the live operations view (all are status 'resolved'). Some fleet
 * numbers repeat so repeat-offender / fleet-health analysis has something to show.
 * Tuple: [daysAgo, fleet_no, depot, route_id, issue_category, wizard_type, decision, miles]
 */
function getDemoHistory() {
  const rows = [
    [2,  '6301', NGT.name, '21',  'Brakes',          'brakes',      'STOP',     9.2],
    [3,  '5437', EFD.name, '10',  'Doors',           'doors',       'AMBER',    3.1],
    [4,  '6301', NGT.name, '21',  'Overheating',     'overheating', 'STOP',    14.0],
    [5,  '6078', NGT.name, '56',  'Steering',        'steering',    'STOP',     7.4],
    [6,  '5318', HCR.name, 'X45', 'Speedometer',     'speedo',      'AMBER',    5.0],
    [7,  '6145', SBK.name, 'X1',  'Overheating',     'overheating', 'STOP',    16.8],
    [8,  '5292', HBS.name, '27',  'Doors',           'doors',       'CONTINUE', 2.2],
    [9,  '6301', NGT.name, '21',  'Brakes',          'brakes',      'STOP',    10.6],
    [10, '5510', SBK.name, '8A',  'Buzzers/Bell',    'buzzers',     'CONTINUE', 1.9],
    [11, '6210', NGT.name, '27',  'Wheelchair Ramp', 'ramp',        'STOP',     6.1],
    [12, '5318', HCR.name, 'X45', 'Overheating',     'overheating', 'AMBER',    8.3],
    [13, '6089', HBS.name, '309', 'Puncture',        'puncture',    'STOP',    13.5],
    [14, '5401', WMR.name, '684', 'Fuel System',     'fuel',        'AMBER',    7.0],
    [15, '6078', NGT.name, '56',  'Doors',           'doors',       'AMBER',    3.8],
    [16, '5195', EFD.name, '35',  'Suspension',      'suspension',  'AMBER',    4.6],
    [18, '6322', EFD.name, '21',  'Brakes',          'brakes',      'STOP',    11.2],
    [19, '5267', HCR.name, 'X30', 'Overheating',     'overheating', 'AMBER',    6.4],
    [20, '5155', HBS.name, '309', 'Buzzers/Bell',    'buzzers',     'CONTINUE', 2.1],
    [22, '6145', SBK.name, 'X1',  'Brakes',          'brakes',      'STOP',    15.9],
    [24, '5437', EFD.name, '10',  'Steering',        'steering',    'STOP',     8.0],
    [25, '6210', NGT.name, '27',  'Doors',           'doors',       'AMBER',    3.4],
    [26, '5401', WMR.name, '684', 'Speedometer',     'speedo',      'CONTINUE', 1.5],
    [27, '6089', HBS.name, '309', 'Overheating',     'overheating', 'STOP',    12.7],
    [28, '5318', HCR.name, 'X45', 'Suspension',      'suspension',  'AMBER',    5.7],
  ];
  return rows.map(([d, fleet, depot, route, cat, wt, dec, miles], i) => ({
    breakdown_id: `DEMO-H${String(i + 1).padStart(2, '0')}`,
    fleet_no: fleet,
    depot,
    supervisor_badge: DEMO_BADGE,
    supervisor_name: DEMO_SUPERVISOR_NAME,
    location_description: `${depot} area`,
    issue_category: cat,
    status: 'resolved',
    severity: dec,
    wizard_decision: dec,
    wizard_type: wt,
    breakdown_source: 'wizard',
    route_id: route,
    estimated_mileage_lost: miles,
    wizard_assessment_data: JSON.stringify({ route }),
    created_at: timeAgo(d * 24, 0),
    resolved_at: timeAgo(d * 24 - 3, 0),
  }));
}

/**
 * Replacement vehicles (BSOG dead-mileage) seeded for the demo.
 * Coordinates mirror the matching demo breakdowns so the map/calcs line up.
 * One en-route dispatch (dead miles only) and one completed run (with pickup
 * miles + total) so both stages of the BSOG flow are visible.
 */
function getDemoReplacements() {
  return [
    // Completed run for DEMO-005 (Overheating, Southbank Bus Station, Southbank depot) - full BSOG total
    {
      breakdown_id: 'DEMO-005',
      depot: SBK.name,
      replacement_fleet_no: '6312',
      sending_depot_code: SBK.code,
      sending_depot_name: SBK.name,
      depot_lat: SBK.lat,
      depot_lng: SBK.lng,
      breakdown_lat: 54.8607,
      breakdown_lng: -1.5741,
      dead_miles: 14.2,
      dead_miles_duration_minutes: 27,
      pickup_miles: 5.8,
      pickup_miles_duration_minutes: 12,
      total_dead_miles: 20.0,
      return_to_service_lat: 54.8639,
      return_to_service_lng: -1.5729,
      return_to_service_location: 'Southbank High Street',
      return_to_service_at: timeAgo(0, 25),
      status: 'in_service',
      created_at: timeAgo(0, 40)
    },
    // En-route dispatch for DEMO-009 (Puncture, Ring Road near Harbourside, Harbourside depot) - dead miles only
    {
      breakdown_id: 'DEMO-009',
      depot: HBS.name,
      replacement_fleet_no: '5301',
      sending_depot_code: HBS.code,
      sending_depot_name: HBS.name,
      depot_lat: HBS.lat,
      depot_lng: HBS.lng,
      breakdown_lat: 54.9174,
      breakdown_lng: -1.3789,
      dead_miles: 1.4,
      dead_miles_duration_minutes: 5,
      pickup_miles: null,
      pickup_miles_duration_minutes: null,
      total_dead_miles: 1.4,
      return_to_service_lat: null,
      return_to_service_lng: null,
      return_to_service_location: null,
      return_to_service_at: null,
      status: 'dispatched',
      created_at: timeAgo(0, 12)
    }
  ];
}

/**
 * Demo engineers - tagged managed_by = DEMO_SUPERVISOR_ID so they isolate cleanly
 * from real staff. Names match the engineers dispatched on the demo breakdowns.
 * home_depot_code uses the fictional demo depot codes (data/demoDepots.js):
 * NGT=Northgate, EFD=Eastfield, SBK=Southbank, HBS=Harbourside, HCR=Hillcrest.
 */
function getDemoEngineers() {
  return [
    { id: 'demo-eng-0000-0000-000000000001', name: 'Mark Robson', badge_number: 'DEMO-E01', home_depot_code: NGT.code, skills: ['Mechanical', 'Brakes', 'Diagnostics'] },
    { id: 'demo-eng-0000-0000-000000000002', name: 'Dave Hedley', badge_number: 'DEMO-E02', home_depot_code: EFD.code, skills: ['Electrical', 'Doors', 'Diagnostics'] },
    { id: 'demo-eng-0000-0000-000000000003', name: 'Paul Charlton', badge_number: 'DEMO-E03', home_depot_code: SBK.code, skills: ['Mechanical', 'HVAC', 'Suspension'] },
    { id: 'demo-eng-0000-0000-000000000004', name: 'Stephen Liddle', badge_number: 'DEMO-E04', home_depot_code: HBS.code, skills: ['EV/Hybrid', 'Electrical', 'Brakes'] },
    // Two free engineers, so the dispatch board always has someone to suggest
    { id: 'demo-eng-0000-0000-000000000005', name: 'Gary Pattinson', badge_number: 'DEMO-E05', home_depot_code: NGT.code, skills: ['Mechanical', 'Electrical', 'Doors'] },
    { id: 'demo-eng-0000-0000-000000000006', name: 'Lee Swinburne', badge_number: 'DEMO-E06', home_depot_code: HCR.code, skills: ['Diagnostics', 'HVAC', 'Transmission'] },
    // Rostered on the next shift, so the roster shows upcoming cover too
    { id: 'demo-eng-0000-0000-000000000007', name: 'Craig Dunn', badge_number: 'DEMO-E07', home_depot_code: EFD.code, skills: ['Body', 'Doors', 'Electrical'], upcoming: true },
    { id: 'demo-eng-0000-0000-000000000008', name: 'Neil Tate', badge_number: 'DEMO-E08', home_depot_code: WMR.code, skills: ['Mechanical', 'Brakes', 'Suspension'], upcoming: true },
  ];
}

/**
 * Build matching activity records for the demo: a breakdown report for every
 * incident, plus engineer-dispatch / on-site and replacement-vehicle events so
 * the activity feed shows a realistic operational audit trail.
 * NOTE: every record keeps actor_id = DEMO_BADGE so the demo isolation filter
 * (actor_id = 'DEMO01') includes them.
 */
function getDemoActivities(breakdowns, replacements) {
  const activities = [];

  for (const b of breakdowns) {
    // Shared entity_details so the frontend's activity message formatter can
    // pick out a fleet number / location / issue per event — without this the
    // formatter falls back to a generic sentence and every row in the feed
    // reads identically ("Demo User requested an engineer" x3, etc).
    const entityDetails = JSON.stringify({
      fleetNo: b.fleet_no,
      location: b.location_description,
      issueCategory: b.issue_category,
      wizardType: b.wizard_type
    });
    const severity = b.severity === 'STOP' ? 'critical' : b.severity === 'AMBER' ? 'warning' : 'info';

    // 1. Breakdown reported
    activities.push({
      activity_type: 'breakdown_reported',
      action: `reported ${b.issue_category} breakdown on fleet ${b.fleet_no}`,
      actor_type: 'supervisor',
      actor_id: DEMO_BADGE,
      actor_name: DEMO_SUPERVISOR_NAME,
      entity_type: 'breakdown',
      entity_id: b.breakdown_id,
      entity_details: entityDetails,
      severity,
      source: 'wizard',
      depot: b.depot,
      icon: b.severity === 'STOP' ? '🚨' : b.severity === 'AMBER' ? '⚡' : '⚠️',
      created_at: b.created_at
    });

    // 2. Assessment/decision completed a few minutes later (varies per fleet
    //    so timestamps don't all line up identically)
    activities.push({
      activity_type: 'wizard_completed',
      action: `completed a ${b.wizard_type} assessment on fleet ${b.fleet_no}: ${b.wizard_decision}`,
      actor_type: 'supervisor',
      actor_id: DEMO_BADGE,
      actor_name: DEMO_SUPERVISOR_NAME,
      entity_type: 'breakdown',
      entity_id: b.breakdown_id,
      entity_details: entityDetails,
      metadata: JSON.stringify({ decision: b.wizard_decision, wizardType: b.wizard_type }),
      severity,
      source: 'wizard',
      depot: b.depot,
      icon: '📋',
      created_at: minutesAfter(b.created_at, 2 + (parseInt(b.fleet_no, 10) % 5))
    });

    // 3. Engineer dispatched
    if (b.engineer_name && b.engineer_dispatched_at) {
      activities.push({
        activity_type: 'engineer_assigned',
        action: `dispatched engineer ${b.engineer_name} to fleet ${b.fleet_no}`,
        actor_type: 'supervisor',
        actor_id: DEMO_BADGE,
        actor_name: DEMO_SUPERVISOR_NAME,
        entity_type: 'breakdown',
        entity_id: b.breakdown_id,
        entity_details: entityDetails,
        severity: 'info',
        source: 'engineering',
        depot: b.depot,
        icon: '👷',
        created_at: b.engineer_dispatched_at
      });
    }

    // 4. Engineer on site
    if (b.engineer_on_site_at) {
      activities.push({
        activity_type: 'engineer_on_site',
        action: `engineer ${b.engineer_name} arrived on site for fleet ${b.fleet_no}`,
        actor_type: 'engineer',
        actor_id: DEMO_BADGE,
        actor_name: b.engineer_name,
        entity_type: 'breakdown',
        entity_id: b.breakdown_id,
        entity_details: entityDetails,
        severity: 'info',
        source: 'engineering',
        depot: b.depot,
        icon: '🔧',
        created_at: b.engineer_on_site_at
      });
    }

    // 5. Resolved — matches the resolved_at already written onto the breakdown
    //    (RESOLVED_AT) so the activity feed and the breakdown record agree.
    if ((b.status === 'resolved' || b.status === 'completed') && resolvedAtFor(b.breakdown_id)) {
      activities.push({
        activity_type: 'breakdown_resolved',
        action: `resolved breakdown on fleet ${b.fleet_no}`,
        actor_type: 'supervisor',
        actor_id: DEMO_BADGE,
        actor_name: DEMO_SUPERVISOR_NAME,
        entity_type: 'breakdown',
        entity_id: b.breakdown_id,
        entity_details: entityDetails,
        severity: 'info',
        source: 'operations',
        depot: b.depot,
        icon: '✅',
        created_at: resolvedAtFor(b.breakdown_id)
      });
    }
  }

  for (const r of replacements) {
    const entityDetails = JSON.stringify({
      fleetNo: r.replacement_fleet_no,
      location: r.sending_depot_name
    });

    // Dispatched — note: activity_type deliberately avoids the substring
    // "breakdown" so the frontend doesn't badge a routine replacement
    // dispatch as a red "BREAKDOWN" event.
    activities.push({
      activity_type: 'replacement_dispatched',
      action: `dispatched replacement vehicle ${r.replacement_fleet_no} from ${r.sending_depot_name}`,
      actor_type: 'supervisor',
      actor_id: DEMO_BADGE,
      actor_name: DEMO_SUPERVISOR_NAME,
      entity_type: 'breakdown',
      entity_id: r.breakdown_id,
      entity_details: entityDetails,
      severity: 'info',
      source: 'operations',
      depot: r.depot,
      icon: '🚌',
      created_at: r.created_at
    });

    // Returned to service — only for replacements that have completed the run
    if (r.return_to_service_at) {
      activities.push({
        activity_type: 'replacement_returned',
        action: `marked replacement vehicle ${r.replacement_fleet_no} back in service near ${r.return_to_service_location || r.sending_depot_name}`,
        actor_type: 'supervisor',
        actor_id: DEMO_BADGE,
        actor_name: DEMO_SUPERVISOR_NAME,
        entity_type: 'breakdown',
        entity_id: r.breakdown_id,
        entity_details: entityDetails,
        severity: 'info',
        source: 'operations',
        depot: r.depot,
        icon: '🏁',
        created_at: r.return_to_service_at
      });
    }
  }

  // A single handover note for narrative flavour — supervisors routinely
  // leave a note for the incoming shift on an ongoing incident.
  const handoverTarget = breakdowns.find(b => b.status === 'in_progress') || breakdowns[0];
  if (handoverTarget) {
    activities.push({
      activity_type: 'handover_note',
      action: `left a handover note on fleet ${handoverTarget.fleet_no}: engineer en route, monitor and update the incoming shift`,
      actor_type: 'supervisor',
      actor_id: DEMO_BADGE,
      actor_name: DEMO_SUPERVISOR_NAME,
      entity_type: 'breakdown',
      entity_id: handoverTarget.breakdown_id,
      entity_details: JSON.stringify({
        fleetNo: handoverTarget.fleet_no,
        location: handoverTarget.location_description,
        issueCategory: handoverTarget.issue_category
      }),
      severity: 'info',
      source: 'duty',
      depot: handoverTarget.depot,
      icon: '📝',
      created_at: minutesAfter(handoverTarget.created_at, 5)
    });
  }

  return activities;
}

/**
 * Seed demo data - deletes existing demo data and inserts fresh set.
 * Called on every demo login to ensure a consistent experience.
 */
export async function seedDemoData() {
  console.log('🎭 Seeding demo data...');

  const seedErrors = [];
  try {
    // 1. Delete existing demo activities
    await query(
      "DELETE FROM activities WHERE actor_id = ?",
      [DEMO_BADGE]
    );

    // 2. Delete existing demo breakdowns (also cleans up any breakdowns created during a demo session)
    await query(
      "DELETE FROM breakdowns WHERE supervisor_badge = ?",
      [DEMO_BADGE]
    );

    // 3. Insert demo breakdowns (core columns only — guaranteed to exist so the
    //    demo always has data even if an optional enhancement below fails)
    const breakdowns = getDemoBreakdowns();
    for (const b of breakdowns) {
      await query(
        `INSERT INTO breakdowns (
          breakdown_id, fleet_no, depot, supervisor_badge, supervisor_name,
          location_description, location_lat, location_lng, issue_category,
          status, severity, wizard_decision, wizard_type, breakdown_source,
          wizard_assessment_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          b.breakdown_id, b.fleet_no, b.depot, b.supervisor_badge, b.supervisor_name,
          b.location_description, b.location_lat, b.location_lng, b.issue_category,
          b.status, b.severity, b.wizard_decision, b.wizard_type, b.breakdown_source,
          b.wizard_assessment_data, b.created_at
        ]
      );
    }

    // 3a. Enrich the live breakdowns with route (SHORT name — matches how real
    //     breakdowns store route_id), mileage and resolved time so route status,
    //     mileage reports and analytics have data. Best-effort. Route 21 has two
    //     live breakdowns -> shows RED on the route-status board.
    const ROUTE = {
      'DEMO-001': '21', 'DEMO-002': '56', 'DEMO-003': '10', 'DEMO-004': null,
      'DEMO-005': 'X1', 'DEMO-006': 'X45', 'DEMO-007': '27', 'DEMO-008': '35',
      'DEMO-009': '309', 'DEMO-010': '684', 'DEMO-011': '8A', 'DEMO-012': '21',
      'DEMO-013': 'X30', 'DEMO-014': null
    };
    const MILEAGE = {
      'DEMO-001': 12.4, 'DEMO-002': 8.1, 'DEMO-003': 5.5, 'DEMO-004': 2.0, 'DEMO-005': 18.3,
      'DEMO-006': 9.7, 'DEMO-007': 6.8, 'DEMO-008': 4.2, 'DEMO-009': 15.0, 'DEMO-010': 7.5,
      'DEMO-011': 3.3, 'DEMO-012': 11.0, 'DEMO-013': 6.0, 'DEMO-014': 1.8
    };
    try {
      for (let i = 0; i < breakdowns.length; i++) {
        const b = breakdowns[i];
        const ackMins = 2 + (i % 7); // realistic 2-8 min acknowledgement time
        await query(
          `UPDATE breakdowns SET route_id = ?, estimated_mileage_lost = ?, resolved_at = ?,
             received_at = created_at, acknowledged_at = DATE_ADD(created_at, INTERVAL ? MINUTE)
           WHERE breakdown_id = ?`,
          [ROUTE[b.breakdown_id] || null, MILEAGE[b.breakdown_id] || null,
           resolvedAtFor(b.breakdown_id) || null, ackMins, b.breakdown_id]
        );
      }
    } catch (enrichErr) {
      console.error('🎭 Demo breakdown enrichment skipped (non-fatal):', enrichErr.message);
    }

    // 3b. Insert historical resolved breakdowns for analytics/trends depth (best-effort)
    let historyCount = 0;
    try {
      const history = getDemoHistory();
      for (const h of history) {
        await query(
          `INSERT INTO breakdowns (
            breakdown_id, fleet_no, depot, supervisor_badge, supervisor_name,
            location_description, issue_category, status, severity, wizard_decision,
            wizard_type, breakdown_source, route_id, estimated_mileage_lost,
            wizard_assessment_data, created_at, resolved_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            h.breakdown_id, h.fleet_no, h.depot, h.supervisor_badge, h.supervisor_name,
            h.location_description, h.issue_category, h.status, h.severity, h.wizard_decision,
            h.wizard_type, h.breakdown_source, h.route_id, h.estimated_mileage_lost,
            h.wizard_assessment_data, h.created_at, h.resolved_at
          ]
        );
        historyCount++;
      }
    } catch (histErr) {
      console.error('🎭 Demo history seeding skipped (non-fatal):', histErr.message);
    }

    // 4. Apply engineer dispatch + live ETA fields (best-effort; isolated so a
    //    missing column can't wipe the core breakdown seed)
    try {
      for (const b of breakdowns) {
        if (!b.engineer_name && !b.engineer_dispatched_at) continue;
        await query(
          `UPDATE breakdowns SET
             engineer_name = ?, engineer_badge = ?, engineer_dispatched_at = ?,
             engineer_eta_minutes = ?, engineer_on_site_at = ?
           WHERE breakdown_id = ?`,
          [
            // badge too: the on-shift roster joins jobs by badge, so without it
            // busy demo engineers showed as available
            b.engineer_name || null, DEMO_ENGINEER_BADGES[b.engineer_name] || null, b.engineer_dispatched_at || null,
            b.engineer_eta_minutes || null, b.engineer_on_site_at || null,
            b.breakdown_id
          ]
        );
      }
    } catch (engFieldErr) {
      console.error('🎭 Demo engineer-ETA fields skipped (non-fatal):', engFieldErr.message);
      seedErrors.push('engineer-eta: ' + engFieldErr.message);
    }

    // 5. Insert demo replacement vehicles (BSOG dead-mileage tracking) — best-effort
    const replacements = getDemoReplacements();
    let replacementCount = 0;
    try {
      await query("DELETE FROM replacement_vehicles WHERE breakdown_id LIKE 'DEMO-%'");
      for (const r of replacements) {
        await query(
          `INSERT INTO replacement_vehicles (
            breakdown_id, breakdown_ref, replacement_fleet_no,
            sending_depot_code, sending_depot_name, depot_lat, depot_lng,
            breakdown_lat, breakdown_lng, dead_miles, dead_miles_duration_minutes,
            pickup_miles, pickup_miles_duration_minutes, total_dead_miles,
            return_to_service_lat, return_to_service_lng, return_to_service_location,
            return_to_service_at, status, dispatched_by_badge, dispatched_by_name,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            r.breakdown_id, r.breakdown_id, r.replacement_fleet_no,
            r.sending_depot_code, r.sending_depot_name, r.depot_lat, r.depot_lng,
            r.breakdown_lat, r.breakdown_lng, r.dead_miles, r.dead_miles_duration_minutes,
            r.pickup_miles, r.pickup_miles_duration_minutes, r.total_dead_miles,
            r.return_to_service_lat, r.return_to_service_lng, r.return_to_service_location,
            r.return_to_service_at, r.status, DEMO_BADGE, DEMO_SUPERVISOR_NAME,
            r.created_at, r.created_at
          ]
        );
        replacementCount++;
      }
    } catch (rvErr) {
      console.error('🎭 Demo replacement seeding skipped (non-fatal):', rvErr.message);
      seedErrors.push('replacement: ' + rvErr.message);
    }

    // 6. Insert matching activities. entity_details/metadata are existing JSON
    //    columns on this table (migration 008) — populating them is what lets
    //    the frontend's message formatter show a distinct fleet/decision per
    //    row instead of one generic sentence repeated for every event. Kept
    //    best-effort: if either JSON column is ever missing in a given prod
    //    schema, fall back to the original narrower insert rather than losing
    //    the whole activity feed.
    const activities = getDemoActivities(breakdowns, replacements);
    let activityCount = 0;
    try {
      for (const a of activities) {
        await query(
          `INSERT INTO activities (
            activity_type, action, actor_type, actor_id, actor_name,
            entity_type, entity_id, entity_details, severity, source, depot,
            icon, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            a.activity_type, a.action, a.actor_type, a.actor_id, a.actor_name,
            a.entity_type, a.entity_id, a.entity_details || null, a.severity,
            a.source, a.depot, a.icon, a.metadata || null, a.created_at
          ]
        );
        activityCount++;
      }
    } catch (activityErr) {
      console.error('🎭 Demo activity seeding (with entity_details) failed, retrying without JSON columns:', activityErr.message);
      seedErrors.push('activities: ' + activityErr.message);
      activityCount = 0;
      for (const a of activities) {
        try {
          await query(
            `INSERT INTO activities (
              activity_type, action, actor_type, actor_id, actor_name,
              entity_type, entity_id, severity, source, depot, icon, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              a.activity_type, a.action, a.actor_type, a.actor_id, a.actor_name,
              a.entity_type, a.entity_id, a.severity, a.source, a.depot, a.icon, a.created_at
            ]
          );
          activityCount++;
        } catch (rowErr) {
          console.error('🎭 Demo activity row skipped:', rowErr.message);
        }
      }
    }

    // 7. Seed demo engineers + today's shifts (isolated so a failure here can't
    //    wipe the core breakdown demo above).
    let engineerCount = 0;
    try {
      const engineers = getDemoEngineers();
      const today = new Date().toISOString().slice(0, 10);

      // Clear previous demo shifts (FK) then patterns and engineers
      await query(
        "DELETE FROM engineer_daily_shifts WHERE checked_in_by = ?",
        [DEMO_SUPERVISOR_ID]
      );
      await query(
        "DELETE FROM engineer_shift_templates WHERE created_by = ?",
        [DEMO_SUPERVISOR_ID]
      );
      await query(
        "DELETE FROM engineers WHERE managed_by = ?",
        [DEMO_SUPERVISOR_ID]
      );

      // Shift patterns. Between them every hour of the day is covered, so
      // whenever someone opens the demo there's a live shift to roster onto.
      const patterns = [
        { name: 'Early', start: 6, end: 14 },
        { name: 'Day', start: 8, end: 17 },
        { name: 'Late', start: 14, end: 22 },
        { name: 'Night', start: 22, end: 6 },
      ];
      const pad = (h) => `${String(h).padStart(2, '0')}:00:00`;
      for (const pt of patterns) {
        const r = await query(
          `INSERT INTO engineer_shift_templates (name, start_time, end_time, created_by, depot_code, is_active)
           VALUES (?, ?, ?, ?, NULL, 1)`,
          [pt.name, pad(pt.start), pad(pt.end), DEMO_SUPERVISOR_ID]
        );
        pt.id = r.insertId;
      }
      const nowHour = new Date().getHours();
      const covers = (pt, h) => (pt.end > pt.start ? h >= pt.start && h < pt.end : h >= pt.start || h < pt.end);
      const current = patterns.filter(pt => covers(pt, nowHour));
      // The next pattern starting later TODAY (for the 'upcoming' engineers).
      // Late in the evening nothing else starts today; they then join the
      // current shift rather than showing as a finished morning shift.
      const next = [...patterns]
        .filter(pt => pt.start > nowHour)
        .sort((a, b) => a.start - b.start)[0] || null;
      let rota = 0;
      for (const e of engineers) {
        await query(
          `INSERT INTO engineers (
            id, name, badge_number, depot, home_depot_code, skills,
            status, is_active, managed_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            e.id, e.name, e.badge_number, e.home_depot_code, e.home_depot_code,
            JSON.stringify(e.skills), 'available', 1, DEMO_SUPERVISOR_ID
          ]
        );
        // Roster each engineer onto a pattern covering NOW (a fixed 06:00-18:00
        // left every demo engineer 'off shift' for evening visitors); the two
        // 'upcoming' engineers go on the next pattern instead
        const pattern = e.upcoming && next ? next : current[rota++ % current.length];
        await query(
          `INSERT INTO engineer_daily_shifts (
            engineer_id, shift_date, shift_template_id, custom_start, custom_end,
            checked_in_by, depot_code, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'on_shift')`,
          [e.id, today, pattern.id, pad(pattern.start), pad(pattern.end), DEMO_SUPERVISOR_ID, e.home_depot_code]
        );
        engineerCount++;
      }
    } catch (engErr) {
      console.error('🎭 Demo engineer seeding skipped (non-fatal):', engErr.message);
      seedErrors.push('engineers: ' + engErr.message);
    }

    // 8. One diversion in force (a worked example), clearing anything a previous
    //    demo visitor planned. Isolated like the steps above.
    let diversionCount = 0;
    try {
      await query("DELETE FROM route_diversions WHERE supervisor_badge = 'DEMO01'");
      const d = DEMO_DIVERSION;
      const now = Date.now();
      await query(
        `INSERT INTO route_diversions (
           id, route_id, route_short_name, direction_id, direction_label, title, reason,
           closure_description, closure_lat, closure_lng, from_stop_id, from_stop_name,
           to_stop_id, to_stop_name, diversion_path, directions, missed_stops, served_stops,
           extra_miles, extra_minutes, start_at, end_at, status, notes,
           created_by, created_by_name, supervisor_badge
         ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, 'Demo Supervisor', 'DEMO01')`,
        [
          d.routeId, d.routeShortName, d.directionId, d.directionLabel, d.title, d.reason,
          d.closureDescription, d.closureLat, d.closureLng, d.fromStopId, d.fromStopName,
          d.toStopId, d.toStopName, JSON.stringify(d.path), JSON.stringify(d.directions),
          JSON.stringify(d.missedStops), JSON.stringify(d.servedStops), d.extraMiles, d.extraMinutes,
          new Date(now - 3 * 3600 * 1000), new Date(now + 5 * 86400 * 1000), d.notes, DEMO_SUPERVISOR_ID,
        ]
      );
      diversionCount = 1;
    } catch (divErr) {
      console.error('🎭 Demo diversion seeding skipped (non-fatal):', divErr.message);
      seedErrors.push('diversions: ' + divErr.message);
    }

    console.log(`🎭 Demo data seeded: ${breakdowns.length} breakdowns (+${historyCount} history), ${replacementCount} replacements, ${activityCount} activities, ${engineerCount} engineers`);
    return { breakdowns: breakdowns.length, history: historyCount, replacements: replacementCount, activities: activityCount, engineers: engineerCount, diversions: diversionCount, errors: seedErrors };
  } catch (error) {
    console.error('🎭 Error seeding demo data:', error);
    throw error;
  }
}

export default { seedDemoData };
