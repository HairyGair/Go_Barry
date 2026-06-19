/**
 * Demo Data Seeding Service
 *
 * Seeds realistic breakdown and activity data for the demo account.
 * All data is tagged with supervisor_badge='DEMO01' and breakdown IDs
 * prefixed with 'DEMO-' for complete isolation from production data.
 */

import { query } from '../utils/queryHelpers.js';

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
 * The 14 demo breakdowns covering all wizard types, severities, statuses, and depots
 */
function getDemoBreakdowns() {
  return [
    // 1. Critical - Active - Brakes
    {
      breakdown_id: 'DEMO-001',
      fleet_no: '6301',
      depot: 'Riverside',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Eldon Square Bus Station, Stand B',
      location_lat: 54.9742,
      location_lng: -1.6142,
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
      depot: 'Riverside',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Gateshead Interchange, Bay 3',
      location_lat: 54.9619,
      location_lng: -1.6015,
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
      depot: 'Washington',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'MetroCentre Bus Station, Stand 7',
      location_lat: 54.9588,
      location_lng: -1.6686,
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
      depot: 'Percy Main',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Whitley Bay Bus Station',
      location_lat: 55.0369,
      location_lng: -1.4444,
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
      depot: 'Deptford',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Durham Bus Station, Bay 1',
      location_lat: 54.7742,
      location_lng: -1.5757,
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
      depot: 'Consett',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Consett Bus Station',
      location_lat: 54.8530,
      location_lng: -1.8298,
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
      depot: 'Riverside',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Haymarket Bus Station, Stand D',
      location_lat: 54.9755,
      location_lng: -1.6134,
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
      depot: 'Washington',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Sunderland Interchange, Stand A',
      location_lat: 54.9040,
      location_lng: -1.3819,
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
      depot: 'Percy Main',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Coast Road, near Silverlink',
      location_lat: 55.0118,
      location_lng: -1.4676,
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
      depot: 'Hexham',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Hexham Bus Station',
      location_lat: 54.9710,
      location_lng: -2.1007,
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
      depot: 'Deptford',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Chester-le-Street, Front Street',
      location_lat: 54.8572,
      location_lng: -1.5718,
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
      depot: 'Washington',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Angel of the North, A1 layby',
      location_lat: 54.9141,
      location_lng: -1.5894,
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
      depot: 'Consett',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'Stanley Bus Station',
      location_lat: 54.8670,
      location_lng: -1.6930,
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
      depot: 'Percy Main',
      supervisor_badge: DEMO_BADGE,
      supervisor_name: DEMO_SUPERVISOR_NAME,
      location_description: 'North Shields Ferry Terminal',
      location_lat: 55.0076,
      location_lng: -1.4395,
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
    [2,  '6301', 'Riverside',  'GNE:GOAO021:21', 'Brakes',      'brakes',      'STOP',    9.2],
    [3,  '5437', 'Washington', 'GNE:GOAO010:10', 'Doors',       'doors',       'AMBER',   3.1],
    [4,  '6301', 'Riverside',  'GNE:GOAO021:21', 'Overheating', 'overheating', 'STOP',   14.0],
    [5,  '6078', 'Riverside',  'GNE:GOAO056:56', 'Steering',    'steering',    'STOP',    7.4],
    [6,  '5318', 'Consett',    'GNE:GOAX045:X45','Speedometer', 'speedo',      'AMBER',   5.0],
    [7,  '6145', 'Deptford',   'GNE:GOAX001:X1', 'Overheating', 'overheating', 'STOP',   16.8],
    [8,  '5292', 'Percy Main', 'GNE:GOAO027:27', 'Doors',       'doors',       'CONTINUE',2.2],
    [9,  '6301', 'Riverside',  'GNE:GOAO021:21', 'Brakes',      'brakes',      'STOP',   10.6],
    [10, '5510', 'Deptford',   'GNE:GOAO008A:8A','Buzzers/Bell','buzzers',     'CONTINUE',1.9],
    [11, '6210', 'Riverside',  'GNE:GOAO027:27', 'Wheelchair Ramp','ramp',     'STOP',    6.1],
    [12, '5318', 'Consett',    'GNE:GOAX045:X45','Overheating', 'overheating', 'AMBER',   8.3],
    [13, '6089', 'Percy Main', 'GNE:GOAO309:309','Puncture',    'puncture',    'STOP',   13.5],
    [14, '5401', 'Hexham',     'GNE:GOAO684:684','Fuel System', 'fuel',        'AMBER',   7.0],
    [15, '6078', 'Riverside',  'GNE:GOAO056:56', 'Doors',       'doors',       'AMBER',   3.8],
    [16, '5195', 'Washington', 'GNE:GOAO035:35', 'Suspension',  'suspension',  'AMBER',   4.6],
    [18, '6322', 'Washington', 'GNE:GOAO021:21', 'Brakes',      'brakes',      'STOP',   11.2],
    [19, '5267', 'Consett',    'GNE:GOAX030:X30','Overheating', 'overheating', 'AMBER',   6.4],
    [20, '5155', 'Percy Main', 'GNE:GOAO309:309','Buzzers/Bell','buzzers',     'CONTINUE',2.1],
    [22, '6145', 'Deptford',   'GNE:GOAX001:X1', 'Brakes',      'brakes',      'STOP',   15.9],
    [24, '5437', 'Washington', 'GNE:GOAO010:10', 'Steering',    'steering',    'STOP',    8.0],
    [25, '6210', 'Riverside',  'GNE:GOAO027:27', 'Doors',       'doors',       'AMBER',   3.4],
    [26, '5401', 'Hexham',     'GNE:GOAO684:684','Speedometer', 'speedo',      'CONTINUE',1.5],
    [27, '6089', 'Percy Main', 'GNE:GOAO309:309','Overheating', 'overheating', 'STOP',   12.7],
    [28, '5318', 'Consett',    'GNE:GOAX045:X45','Suspension',  'suspension',  'AMBER',   5.7],
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
    wizard_assessment_data: JSON.stringify({ route: route.split(':').pop() }),
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
    // Completed run for DEMO-005 (Overheating, Durham, Deptford) - full BSOG total
    {
      breakdown_id: 'DEMO-005',
      depot: 'Deptford',
      replacement_fleet_no: '6312',
      sending_depot_code: 'GTS',
      sending_depot_name: 'Deptford',
      depot_lat: 54.9501,
      depot_lng: -1.5783,
      breakdown_lat: 54.7742,
      breakdown_lng: -1.5757,
      dead_miles: 14.2,
      dead_miles_duration_minutes: 27,
      pickup_miles: 5.8,
      pickup_miles_duration_minutes: 12,
      total_dead_miles: 20.0,
      return_to_service_lat: 54.8572,
      return_to_service_lng: -1.5718,
      return_to_service_location: 'Chester-le-Street, Front Street',
      return_to_service_at: timeAgo(0, 25),
      status: 'in_service',
      created_at: timeAgo(0, 40)
    },
    // En-route dispatch for DEMO-009 (Puncture, Coast Road, Percy Main) - dead miles only
    {
      breakdown_id: 'DEMO-009',
      depot: 'Percy Main',
      replacement_fleet_no: '5301',
      sending_depot_code: 'PM',
      sending_depot_name: 'Percy Main',
      depot_lat: 55.0072,
      depot_lng: -1.4581,
      breakdown_lat: 55.0118,
      breakdown_lng: -1.4676,
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
 * home_depot_code uses the real depot codes (NCL=Riverside, WAS=Washington,
 * GTS=Deptford, PM=Percy Main).
 */
function getDemoEngineers() {
  return [
    { id: 'demo-eng-0000-0000-000000000001', name: 'Mark Robson', badge_number: 'DEMO-E01', home_depot_code: 'NCL', skills: ['Mechanical', 'Brakes', 'Diagnostics'] },
    { id: 'demo-eng-0000-0000-000000000002', name: 'Dave Hedley', badge_number: 'DEMO-E02', home_depot_code: 'WAS', skills: ['Electrical', 'Doors', 'Diagnostics'] },
    { id: 'demo-eng-0000-0000-000000000003', name: 'Paul Charlton', badge_number: 'DEMO-E03', home_depot_code: 'GTS', skills: ['Mechanical', 'HVAC', 'Suspension'] },
    { id: 'demo-eng-0000-0000-000000000004', name: 'Stephen Liddle', badge_number: 'DEMO-E04', home_depot_code: 'PM', skills: ['EV/Hybrid', 'Electrical', 'Brakes'] },
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
    activities.push({
      activity_type: 'breakdown_reported',
      action: `reported ${b.issue_category} breakdown on fleet ${b.fleet_no}`,
      actor_type: 'supervisor',
      actor_id: DEMO_BADGE,
      actor_name: DEMO_SUPERVISOR_NAME,
      entity_type: 'breakdown',
      entity_id: b.breakdown_id,
      severity: b.severity === 'STOP' ? 'critical' : b.severity === 'AMBER' ? 'warning' : 'info',
      source: 'wizard',
      depot: b.depot,
      icon: b.severity === 'STOP' ? '🚨' : b.severity === 'AMBER' ? '⚡' : '⚠️',
      created_at: b.created_at
    });

    if (b.engineer_name && b.engineer_dispatched_at) {
      activities.push({
        activity_type: 'engineer_assigned',
        action: `dispatched engineer ${b.engineer_name} to fleet ${b.fleet_no}`,
        actor_type: 'supervisor',
        actor_id: DEMO_BADGE,
        actor_name: DEMO_SUPERVISOR_NAME,
        entity_type: 'breakdown',
        entity_id: b.breakdown_id,
        severity: 'info',
        source: 'engineering',
        depot: b.depot,
        icon: '👷',
        created_at: b.engineer_dispatched_at
      });
    }

    if (b.engineer_on_site_at) {
      activities.push({
        activity_type: 'engineer_on_site',
        action: `engineer ${b.engineer_name} arrived on site for fleet ${b.fleet_no}`,
        actor_type: 'engineer',
        actor_id: DEMO_BADGE,
        actor_name: b.engineer_name,
        entity_type: 'breakdown',
        entity_id: b.breakdown_id,
        severity: 'info',
        source: 'engineering',
        depot: b.depot,
        icon: '🔧',
        created_at: b.engineer_on_site_at
      });
    }
  }

  for (const r of replacements) {
    activities.push({
      activity_type: 'breakdown_updated',
      action: `dispatched replacement vehicle ${r.replacement_fleet_no} from ${r.sending_depot_name}`,
      actor_type: 'supervisor',
      actor_id: DEMO_BADGE,
      actor_name: DEMO_SUPERVISOR_NAME,
      entity_type: 'breakdown',
      entity_id: r.breakdown_id,
      severity: 'info',
      source: 'operations',
      depot: r.depot,
      icon: '🚌',
      created_at: r.created_at
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

    // 3. Insert demo breakdowns. Core + a few always-present columns (route_id,
    //    estimated_mileage_lost, resolved_at) so route status, mileage reports and
    //    analytics have real data. Full GTFS route_ids so they map to live routes
    //    (route 21 gets two -> shows RED on the route-status board).
    const breakdowns = getDemoBreakdowns();
    const ROUTE_ID = {
      'DEMO-001': 'GNE:GOAO021:21', 'DEMO-002': 'GNE:GOAO056:56', 'DEMO-003': 'GNE:GOAO010:10',
      'DEMO-004': null, 'DEMO-005': 'GNE:GOAX001:X1', 'DEMO-006': 'GNE:GOAX045:X45',
      'DEMO-007': 'GNE:GOAO027:27', 'DEMO-008': 'GNE:GOAO035:35', 'DEMO-009': 'GNE:GOAO309:309',
      'DEMO-010': 'GNE:GOAO684:684', 'DEMO-011': 'GNE:GOAO008A:8A', 'DEMO-012': 'GNE:GOAO021:21',
      'DEMO-013': 'GNE:GOAX030:X30', 'DEMO-014': null
    };
    const MILEAGE = {
      'DEMO-001': 12.4, 'DEMO-002': 8.1, 'DEMO-003': 5.5, 'DEMO-004': 2.0, 'DEMO-005': 18.3,
      'DEMO-006': 9.7, 'DEMO-007': 6.8, 'DEMO-008': 4.2, 'DEMO-009': 15.0, 'DEMO-010': 7.5,
      'DEMO-011': 3.3, 'DEMO-012': 11.0, 'DEMO-013': 6.0, 'DEMO-014': 1.8
    };
    const RESOLVED_AT = { 'DEMO-010': timeAgo(4, 30), 'DEMO-011': timeAgo(6, 0) };
    for (const b of breakdowns) {
      await query(
        `INSERT INTO breakdowns (
          breakdown_id, fleet_no, depot, supervisor_badge, supervisor_name,
          location_description, location_lat, location_lng, issue_category,
          status, severity, wizard_decision, wizard_type, breakdown_source,
          wizard_assessment_data, created_at,
          route_id, estimated_mileage_lost, resolved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          b.breakdown_id, b.fleet_no, b.depot, b.supervisor_badge, b.supervisor_name,
          b.location_description, b.location_lat, b.location_lng, b.issue_category,
          b.status, b.severity, b.wizard_decision, b.wizard_type, b.breakdown_source,
          b.wizard_assessment_data, b.created_at,
          ROUTE_ID[b.breakdown_id] || null, MILEAGE[b.breakdown_id] || null,
          RESOLVED_AT[b.breakdown_id] || null
        ]
      );
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
             engineer_name = ?, engineer_dispatched_at = ?,
             engineer_eta_minutes = ?, engineer_on_site_at = ?
           WHERE breakdown_id = ?`,
          [
            b.engineer_name || null, b.engineer_dispatched_at || null,
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

    // 6. Insert matching activities
    const activities = getDemoActivities(breakdowns, replacements);
    for (const a of activities) {
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
    }

    // 7. Seed demo engineers + today's shifts (isolated so a failure here can't
    //    wipe the core breakdown demo above).
    let engineerCount = 0;
    try {
      const engineers = getDemoEngineers();
      const today = new Date().toISOString().slice(0, 10);

      // Clear previous demo shifts (FK) then engineers
      await query(
        "DELETE FROM engineer_daily_shifts WHERE checked_in_by = ?",
        [DEMO_SUPERVISOR_ID]
      );
      await query(
        "DELETE FROM engineers WHERE managed_by = ?",
        [DEMO_SUPERVISOR_ID]
      );

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
        // Put each engineer on shift today (06:00-18:00) so the dispatch picker works
        await query(
          `INSERT INTO engineer_daily_shifts (
            engineer_id, shift_date, shift_template_id, custom_start, custom_end,
            checked_in_by, depot_code, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'on_shift')`,
          [e.id, today, null, '06:00:00', '18:00:00', DEMO_SUPERVISOR_ID, e.home_depot_code]
        );
        engineerCount++;
      }
    } catch (engErr) {
      console.error('🎭 Demo engineer seeding skipped (non-fatal):', engErr.message);
      seedErrors.push('engineers: ' + engErr.message);
    }

    console.log(`🎭 Demo data seeded: ${breakdowns.length} breakdowns (+${historyCount} history), ${replacementCount} replacements, ${activities.length} activities, ${engineerCount} engineers`);
    return { breakdowns: breakdowns.length, history: historyCount, replacements: replacementCount, activities: activities.length, engineers: engineerCount, errors: seedErrors };
  } catch (error) {
    console.error('🎭 Error seeding demo data:', error);
    throw error;
  }
}

export default { seedDemoData };
