// ENHANCED DASHBOARD FIX - processedAlerts defensive coding

// The error "Cannot convert object to primitive value" occurs when processedAlerts.all is undefined
// This fix ensures processedAlerts always has the expected structure

// STEP 1: Update the processedAlerts calculation (around line 165-195)
// Replace the existing processedAlerts useMemo with this defensive version:

const processedAlerts = useMemo(() => {
  // Default structure to ensure we always have valid arrays
  const defaultStructure = { 
    critical: [], 
    high: [], 
    medium: [], 
    low: [], 
    all: [] 
  };
  
  // Check if we have valid alert data
  if (!alertsData?.alerts || !Array.isArray(alertsData.alerts)) {
    console.log('⚠️ No alerts data available, returning empty structure');
    return defaultStructure;
  }

  try {
    // Filter alerts based on search query
    const filteredAlerts = alertsData.alerts.filter(alert => {
      // Ensure alert is a valid object
      if (!alert || typeof alert !== 'object') return false;
      
      // Apply search filter if present
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          alert.title?.toLowerCase().includes(query) ||
          alert.description?.toLowerCase().includes(query) ||
          alert.location?.toLowerCase().includes(query) ||
          alert.affectsRoutes?.some(route => 
            route && typeof route === 'string' && route.toLowerCase().includes(query)
          )
        );
      }
      return true;
    });

    // Categorize alerts by severity
    const categorized = {
      critical: filteredAlerts.filter(a => 
        a?.severity?.toLowerCase() === 'high' || a?.priority === 'IMMEDIATE'
      ),
      high: filteredAlerts.filter(a => 
        a?.severity?.toLowerCase() === 'medium' || a?.priority === 'URGENT'
      ),
      medium: filteredAlerts.filter(a => 
        a?.severity?.toLowerCase() === 'low' || a?.priority === 'MONITOR'
      ),
      low: filteredAlerts.filter(a => 
        !a?.severity || a?.priority === 'AWARENESS'
      ),
      all: filteredAlerts
    };

    return categorized;
  } catch (error) {
    console.error('❌ Error processing alerts:', error);
    return defaultStructure;
  }
}, [alertsData, searchQuery]);

// STEP 2: Update the stats calculation (around line 200-210)
// Replace the existing stats useMemo with this defensive version:

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

// STEP 3: Update the filteredAlerts calculation (around line 195)
// Add defensive check:

const filteredAlerts = useMemo(() => {
  if (!processedAlerts) return [];
  
  if (selectedFilter === 'all') {
    return processedAlerts.all || [];
  }
  
  return processedAlerts[selectedFilter] || [];
}, [processedAlerts, selectedFilter]);

// STEP 4: Update the alertsData processing to handle edge cases
// Replace the existing alertsData useMemo:

const alertsData = useMemo(() => {
  // Handle various states of activeAlerts
  if (!activeAlerts) {
    console.log('⏳ Waiting for alerts from Convex...');
    return null;
  }
  
  if (!Array.isArray(activeAlerts)) {
    console.error('❌ activeAlerts is not an array:', activeAlerts);
    return { success: false, alerts: [] };
  }
  
  try {
    return {
      success: true,
      alerts: activeAlerts.map(alert => {
        // Ensure alert is a valid object
        if (!alert || typeof alert !== 'object') {
          console.warn('⚠️ Invalid alert object:', alert);
          return null;
        }
        
        return {
          ...alert,
          id: alert.alertId || alert.id || `temp-${Date.now()}-${Math.random()}`,
          coordinates: alert.coordinates ? 
            (Array.isArray(alert.coordinates) ? alert.coordinates : 
             alert.coordinates.lat && alert.coordinates.lng ? 
             [alert.coordinates.lat, alert.coordinates.lng] : 
             alert.coordinates.latitude && alert.coordinates.longitude ?
             [alert.coordinates.latitude, alert.coordinates.longitude] : null) :
            null
        };
      }).filter(Boolean) // Remove any null entries
    };
  } catch (error) {
    console.error('❌ Error processing Convex alerts:', error);
    return { success: false, alerts: [] };
  }
}, [activeAlerts]);