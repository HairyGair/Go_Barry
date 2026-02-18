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
      created_at: timeAgo(1, 10)
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
      created_at: timeAgo(2, 5)
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
      created_at: timeAgo(1, 30)
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
      created_at: timeAgo(1, 50)
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
 * Build matching activity records for each demo breakdown
 */
function getDemoActivities(breakdowns) {
  return breakdowns.map(b => ({
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
    icon: 'breakdown_new',
    created_at: b.created_at
  }));
}

/**
 * Seed demo data - deletes existing demo data and inserts fresh set.
 * Called on every demo login to ensure a consistent experience.
 */
export async function seedDemoData() {
  console.log('🎭 Seeding demo data...');

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

    // 3. Insert demo breakdowns
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

    // 4. Insert matching activities
    const activities = getDemoActivities(breakdowns);
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

    console.log(`🎭 Demo data seeded: ${breakdowns.length} breakdowns, ${activities.length} activities`);
    return { breakdowns: breakdowns.length, activities: activities.length };
  } catch (error) {
    console.error('🎭 Error seeding demo data:', error);
    throw error;
  }
}

export default { seedDemoData };
