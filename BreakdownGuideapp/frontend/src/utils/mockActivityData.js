// Mock activity data for supervisors
export function generateMockActivities() {
  const supervisors = [
    'John Smith', 'Sarah Jones', 'Mike Brown', 'Emma Wilson', 
    'David Taylor', 'Lisa Anderson', 'Chris Evans', 'Amy Johnson'
  ];
  
  const depots = ['Washington', 'Gateshead', 'Percy Main', 'Riverside', 'Consett'];
  
  const activityTypes = [
    {
      type: 'assessment_started',
      icon: '📋',
      messageTemplate: '{supervisor} started {assessment} assessment on fleet {fleet}',
      severity: 'normal'
    },
    {
      type: 'breakdown_reported',
      icon: '🚨',
      messageTemplate: '{supervisor} reported {issue} on fleet {fleet}',
      severity: 'critical'
    },
    {
      type: 'assessment_completed',
      icon: '✅',
      messageTemplate: '{supervisor} completed assessment on fleet {fleet} - Decision: {decision}',
      severity: 'success'
    },
    {
      type: 'engineer_requested',
      icon: '🔧',
      messageTemplate: '{supervisor} requested engineering support for fleet {fleet}',
      severity: 'warning'
    },
    {
      type: 'vehicle_cleared',
      icon: '✨',
      messageTemplate: '{supervisor} cleared fleet {fleet} for service',
      severity: 'success'
    },
    {
      type: 'priority_alert',
      icon: '⚡',
      messageTemplate: '{supervisor} flagged priority issue: {issue} on route {route}',
      severity: 'critical'
    }
  ];
  
  const assessmentTypes = ['Steering', 'Brakes', 'Battery', 'ABS Light', 'Oil Warning', 'Doors', 'Wipers'];
  const issues = ['brake failure', 'steering issues', 'battery warning', 'ABS malfunction', 'door mechanism fault'];
  const decisions = ['STOP', 'AMBER', 'CONTINUE'];
  const routes = ['X1', '21', '56', 'Q3', 'X10', '309', '310'];
  
  const activities = [];
  const now = new Date();
  
  // Generate 25 activities with varying timestamps
  for (let i = 0; i < 25; i++) {
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];
    const depot = depots[Math.floor(Math.random() * depots.length)];
    const fleet = Math.floor(Math.random() * 7000) + 5000; // Fleet numbers 5000-12000
    
    // Create timestamp going back up to 8 hours
    const minutesAgo = Math.floor(Math.random() * 480); // Up to 8 hours
    const timestamp = new Date(now.getTime() - minutesAgo * 60000);
    
    let message = activityType.messageTemplate;
    let decision = null;
    
    // Replace placeholders
    message = message.replace('{supervisor}', supervisor);
    message = message.replace('{fleet}', fleet);
    
    if (message.includes('{assessment}')) {
      const assessment = assessmentTypes[Math.floor(Math.random() * assessmentTypes.length)];
      message = message.replace('{assessment}', assessment);
    }
    
    if (message.includes('{issue}')) {
      const issue = issues[Math.floor(Math.random() * issues.length)];
      message = message.replace('{issue}', issue);
    }
    
    if (message.includes('{decision}')) {
      decision = decisions[Math.floor(Math.random() * decisions.length)];
      message = message.replace('{decision}', decision);
    }
    
    if (message.includes('{route}')) {
      const route = routes[Math.floor(Math.random() * routes.length)];
      message = message.replace('{route}', route);
    }
    
    activities.push({
      id: `activity-${i}-${Date.now()}`,
      type: activityType.type,
      icon: activityType.icon,
      message: message,
      time: formatTime(timestamp),
      timestamp: timestamp.toISOString(),
      depot: depot,
      severity: activityType.severity,
      decision: decision,
      supervisor: supervisor,
      metadata: {
        fleet: fleet,
        generated: true
      }
    });
  }
  
  // Sort by timestamp (most recent first)
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return activities;
}

function formatTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffMins / 1440);
    return `${days}d ago`;
  }
}
