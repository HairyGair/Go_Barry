// backend/test-activity-logs-import.js
// Test script to check if activity logs can be imported

import activityLogsAPI from './routes/activityLogs.js';
import supervisorManager from './services/supervisorManager.js';

console.log('Testing imports...');
console.log('activityLogsAPI type:', typeof activityLogsAPI);
console.log('activityLogsAPI:', activityLogsAPI);
console.log('supervisorManager type:', typeof supervisorManager);
console.log('supervisorManager methods:', Object.keys(supervisorManager));

// Try to call getActivityLogs
try {
  const logs = await supervisorManager.getActivityLogs({});
  console.log('✅ getActivityLogs works:', logs);
} catch (error) {
  console.error('❌ getActivityLogs failed:', error.message);
}

console.log('Test complete');
process.exit(0);
