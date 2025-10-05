/**
 * Activity Message Formatter
 *
 * Generates human-readable, contextual messages for the Live Activity Feed
 * Formats messages to show specific actions supervisors are taking
 */

/**
 * Format an activity into a human-readable message
 * @param {Object} activity - The activity object from the API
 * @returns {string} - A formatted, human-readable message
 */
export function formatActivityMessage(activity) {
  // Extract supervisor name - prioritize actual name over badge ID
  const supervisorName = activity.actor_name ||
                        activity.supervisorName ||
                        activity.supervisor_name ||
                        activity.supervisor ||
                        activity.reported_by ||
                        (activity.supervisor_badge ? `Supervisor ${activity.supervisor_badge}` : null) ||
                        'A supervisor';

  // Extract fleet number
  const fleetNumber = activity.entity_details?.fleetNo ||
                     activity.fleet_no ||
                     activity.fleet_number ||
                     activity.busNumber ||
                     activity.vehicle;

  // Extract breakdown ID
  const breakdownId = activity.breakdown_id ||
                     activity.entity_id ||
                     activity.id;

  // Extract decision
  const decision = activity.metadata?.decision ||
                  activity.decision ||
                  activity.wizard_decision ||
                  activity.severity;

  // Extract issue type
  const issueType = activity.entity_details?.issueCategory ||
                   activity.issue_category ||
                   activity.issue_type ||
                   activity.issue;

  // Extract location
  const location = activity.entity_details?.location ||
                  activity.location ||
                  activity.location_description;

  // Extract wizard/assessment type
  const wizardType = activity.metadata?.wizardType ||
                    activity.wizard_type ||
                    activity.entity_details?.wizardType;

  // Get activity type
  const activityType = activity.activity_type || activity.type;

  // Format message based on activity type
  switch (activityType) {
    // Breakdown reported
    case 'breakdown_reported':
    case 'BREAKDOWN_REPORTED':
      if (fleetNumber) {
        return `${supervisorName} reported a breakdown on ${fleetNumber}`;
      }
      return `${supervisorName} reported a breakdown`;

    // Wizard/Assessment completed
    case 'wizard_completed':
    case 'WIZARD_COMPLETED':
    case 'ASSESSMENT_COMPLETED':
    case 'breakdown_guide_completed':
    case 'breakdown_guide_assessment':
      if (decision && fleetNumber) {
        return `${supervisorName} made a ${decision} decision on ${fleetNumber}`;
      }
      if (fleetNumber) {
        return `${supervisorName} completed a breakdown on ${fleetNumber}`;
      }
      if (decision) {
        return `${supervisorName} made a ${decision} decision`;
      }
      return `${supervisorName} completed an assessment`;

    // Wizard started
    case 'wizard_started':
    case 'WIZARD_STARTED':
      if (fleetNumber) {
        return `${supervisorName} started assessing ${fleetNumber}`;
      }
      return `${supervisorName} started an assessment`;

    // Engineer assigned
    case 'engineer_assigned':
    case 'ENGINEER_ASSIGNED':
      if (fleetNumber) {
        return `${supervisorName} requested an engineer for ${fleetNumber}`;
      }
      return `${supervisorName} requested an engineer`;

    // Engineer on site
    case 'engineer_on_site':
    case 'ENGINEER_ON_SITE':
      if (fleetNumber) {
        return `Engineer arrived at ${fleetNumber}`;
      }
      return `Engineer arrived on site`;

    // Engineer dispatched
    case 'engineer_dispatched':
    case 'ENGINEER_DISPATCHED':
      if (fleetNumber) {
        return `Engineer dispatched to ${fleetNumber}`;
      }
      return `Engineer dispatched`;

    // Breakdown resolved
    case 'breakdown_resolved':
    case 'BREAKDOWN_RESOLVED':
    case 'resolved':
      if (fleetNumber) {
        return `${supervisorName} resolved breakdown on ${fleetNumber}`;
      }
      return `${supervisorName} resolved a breakdown`;

    // Breakdown updated
    case 'breakdown_updated':
    case 'BREAKDOWN_UPDATED':
      if (fleetNumber) {
        return `${supervisorName} updated breakdown on ${fleetNumber}`;
      }
      return `${supervisorName} updated a breakdown`;

    // SDC decision
    case 'sdc_decision':
    case 'SDC_DECISION':
      if (decision && fleetNumber) {
        return `${supervisorName} made SDC decision: ${decision} on ${fleetNumber}`;
      }
      return `${supervisorName} made an SDC decision`;

    // Status update
    case 'status_update':
      if (fleetNumber) {
        return `${supervisorName} updated status for ${fleetNumber}`;
      }
      return `${supervisorName} updated status`;

    // Breakdown acknowledged
    case 'acknowledged':
    case 'breakdown_acknowledged':
      if (breakdownId) {
        return `${supervisorName} acknowledged breakdown ${breakdownId}`;
      }
      return `${supervisorName} acknowledged a breakdown`;

    // Default fallback - try to construct from available data
    default:
      // If we have an action field, use it
      if (activity.action) {
        return `${supervisorName} ${activity.action}`;
      }

      // If we have a message field, use it as fallback
      if (activity.message) {
        // Check if message already includes supervisor name
        if (activity.message.includes(supervisorName)) {
          return activity.message;
        }
        return activity.message;
      }

      // Last resort - generic message with available details
      if (fleetNumber) {
        return `${supervisorName} updated ${fleetNumber}`;
      }

      return `Activity by ${supervisorName}`;
  }
}

/**
 * Get a secondary detail line for the activity
 * @param {Object} activity - The activity object
 * @returns {string|null} - Secondary detail line or null
 */
export function getActivitySecondaryDetails(activity) {
  const details = [];

  // Add issue type if available
  const issueType = activity.entity_details?.issueCategory ||
                   activity.issue_category ||
                   activity.issue_type ||
                   activity.issue;

  if (issueType) {
    details.push(issueType);
  }

  // Add location if available
  const location = activity.entity_details?.location ||
                  activity.location ||
                  activity.location_description;

  if (location) {
    details.push(`at ${location}`);
  }

  // Add route if available
  const route = activity.route || activity.route_number;
  if (route) {
    details.push(`Route ${route}`);
  }

  return details.length > 0 ? details.join(' • ') : null;
}

/**
 * Get an icon for the activity type
 * @param {Object} activity - The activity object
 * @returns {string} - Emoji icon
 */
export function getActivityIcon(activity) {
  // If activity already has an icon, use it
  if (activity.icon) {
    return activity.icon;
  }

  const activityType = activity.activity_type || activity.type;
  const decision = activity.metadata?.decision || activity.decision || activity.severity;

  // Map activity types to icons
  switch (activityType) {
    case 'breakdown_reported':
    case 'BREAKDOWN_REPORTED':
      return decision === 'STOP' ? '🚨' :
             decision === 'AMBER' ? '⚡' : '⚠️';

    case 'wizard_completed':
    case 'WIZARD_COMPLETED':
    case 'ASSESSMENT_COMPLETED':
    case 'breakdown_guide_completed':
      return decision === 'STOP' ? '🛑' :
             decision === 'AMBER' ? '⚡' : '✅';

    case 'wizard_started':
    case 'WIZARD_STARTED':
      return '📋';

    case 'engineer_assigned':
    case 'ENGINEER_ASSIGNED':
      return '👷';

    case 'engineer_on_site':
    case 'ENGINEER_ON_SITE':
      return '🔧';

    case 'engineer_dispatched':
    case 'ENGINEER_DISPATCHED':
      return '🚗';

    case 'breakdown_resolved':
    case 'BREAKDOWN_RESOLVED':
    case 'resolved':
      return '✔️';

    case 'sdc_decision':
    case 'SDC_DECISION':
      return '📋';

    default:
      return '📝';
  }
}

/**
 * Format activity for display in feed
 * Returns a complete display object with all formatted fields
 */
export function formatActivityForDisplay(activity) {
  return {
    message: formatActivityMessage(activity),
    secondaryDetails: getActivitySecondaryDetails(activity),
    icon: getActivityIcon(activity),
    supervisorName: activity.actor_name ||
                   activity.supervisorName ||
                   activity.supervisor_name ||
                   activity.supervisor,
    fleetNumber: activity.entity_details?.fleetNo ||
                activity.fleet_no ||
                activity.busNumber,
    decision: activity.metadata?.decision ||
             activity.decision ||
             activity.severity,
    timestamp: activity.timestamp || activity.created_at,
    depot: activity.depot,
    severity: activity.severity
  };
}
