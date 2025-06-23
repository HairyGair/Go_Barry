// QUICK COPY-PASTE FIX for EnhancedDashboard.jsx
// 
// Find this code around line 202:
//
//   const stats = useMemo(() => {
//     const alerts = processedAlerts.all;
//     return {
//       total: alerts.length,
//       ...
//
// And REPLACE THE ENTIRE stats FUNCTION with this:

const stats = useMemo(() => {
  // Ensure processedAlerts has valid data with defensive checks
  const alerts = processedAlerts?.all || [];
  
  // Calculate statistics with null checks
  const routesSet = new Set();
  alerts.forEach(alert => {
    if (alert?.affectsRoutes && Array.isArray(alert.affectsRoutes)) {
      alert.affectsRoutes.forEach(route => {
        if (route) routesSet.add(route);
      });
    }
  });

  return {
    total: alerts.length,
    critical: processedAlerts?.critical?.length || 0,
    high: processedAlerts?.high?.length || 0,
    medium: processedAlerts?.medium?.length || 0,
    routesAffected: routesSet.size,
    enhanced: alerts.filter(a => a?.enhanced).length
  };
}, [processedAlerts]);

// ALSO find this code (around line 195):
//
//   const filteredAlerts = useMemo(() => {
//     if (selectedFilter === 'all') return processedAlerts.all;
//     ...
//
// And REPLACE with:

const filteredAlerts = useMemo(() => {
  if (!processedAlerts) return [];
  
  if (selectedFilter === 'all') {
    return processedAlerts.all || [];
  }
  
  return processedAlerts[selectedFilter] || [];
}, [processedAlerts, selectedFilter]);

// That's it! Save the file and refresh your browser.