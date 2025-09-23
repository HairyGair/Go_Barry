// Emergency script to stop all polling and enable fallback login
// Run this in the browser console if the app is unresponsive

// Stop all polling intervals
if (window.pollingManagerState && window.pollingManagerState.activePollers) {
  window.pollingManagerState.activePollers.forEach((intervalId) => {
    clearInterval(intervalId);
  });
  window.pollingManagerState.activePollers.clear();
  console.log('✅ Stopped all polling');
}

// Clear dashboard cache
if (window.dashboardRequestCache) {
  window.dashboardRequestCache.failureCount = 0;
  window.dashboardRequestCache.pendingRequest = null;
  console.log('✅ Cleared dashboard cache');
}

// Enable fallback supervisor mode
localStorage.setItem('use_fallback_supervisors', 'true');
console.log('✅ Enabled fallback supervisor mode');

console.log('\n🔐 You can now login with:');
console.log('Supervisor: Any from dropdown');
console.log('Password: testpassword');
console.log('\n🔄 Refresh the page to apply changes');
