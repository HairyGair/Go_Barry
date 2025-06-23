// Quick fix script for EnhancedDashboard.jsx error
// This adds defensive coding to prevent "Cannot convert object to primitive value" errors

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '../Go_BARRY/components/EnhancedDashboard.jsx');

// Read the current file
let content = fs.readFileSync(dashboardPath, 'utf8');

// Fix 1: Replace alertsData processing
const alertsDataOld = `const alertsData = useMemo(() => {
    if (!activeAlerts) return null;
    return {
      success: true,
      alerts: activeAlerts.map(alert => ({
        ...alert,
        id: alert.alertId || alert.id, // Ensure consistent ID field
        coordinates: alert.coordinates ? 
          (Array.isArray(alert.coordinates) ? alert.coordinates : 
           alert.coordinates.lat && alert.coordinates.lng ? 
           [alert.coordinates.lat, alert.coordinates.lng] : 
           alert.coordinates.latitude && alert.coordinates.longitude ?
           [alert.coordinates.latitude, alert.coordinates.longitude] : null) :
          null
      }))
    };
  }, [activeAlerts]);`;

const alertsDataNew = `const alertsData = useMemo(() => {
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
            id: alert.alertId || alert.id || \`temp-\${Date.now()}-\${Math.random()}\`,
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
  }, [activeAlerts]);`;

// Fix 2: Replace processedAlerts calculation
const processedAlertsOld = `const processedAlerts = useMemo(() => {
    if (!alertsData?.alerts) return { critical: [], high: [], medium: [], low: [], all: [] };

    const alerts = alertsData.alerts.filter(alert => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          alert.title?.toLowerCase().includes(query) ||
          alert.description?.toLowerCase().includes(query) ||
          alert.location?.toLowerCase().includes(query) ||
          alert.affectsRoutes?.some(route => route.toLowerCase().includes(query))
        );
      }
      return true;
    });

    const categorized = {
      critical: alerts.filter(a => a.severity?.toLowerCase() === 'high' || a.priority === 'IMMEDIATE'),
      high: alerts.filter(a => a.severity?.toLowerCase() === 'medium' || a.priority === 'URGENT'),
      medium: alerts.filter(a => a.severity?.toLowerCase() === 'low' || a.priority === 'MONITOR'),
      low: alerts.filter(a => !a.severity || a.priority === 'AWARENESS'),
      all: alerts
    };

    return categorized;
  }, [alertsData, searchQuery]);`;

const processedAlertsNew = `const processedAlerts = useMemo(() => {
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
  }, [alertsData, searchQuery]);`;

// Fix 3: Replace stats calculation
const statsOld = `const stats = useMemo(() => {
    const alerts = processedAlerts.all;
    return {
      total: alerts.length,
      critical: processedAlerts.critical.length,
      high: processedAlerts.high.length,
      medium: processedAlerts.medium.length,
      routesAffected: new Set(alerts.flatMap(a => a.affectsRoutes || [])).size,
      enhanced: alerts.filter(a => a.enhanced).length
    };
  }, [processedAlerts]);`;

const statsNew = `const stats = useMemo(() => {
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
  }, [processedAlerts]);`;

// Fix 4: Update filteredAlerts
const filteredAlertsOld = `const filteredAlerts = useMemo(() => {
    if (selectedFilter === 'all') return processedAlerts.all;
    return processedAlerts[selectedFilter] || [];
  }, [processedAlerts, selectedFilter]);`;

const filteredAlertsNew = `const filteredAlerts = useMemo(() => {
    if (!processedAlerts) return [];
    
    if (selectedFilter === 'all') {
      return processedAlerts.all || [];
    }
    
    return processedAlerts[selectedFilter] || [];
  }, [processedAlerts, selectedFilter]);`;

// Apply the fixes
content = content.replace(alertsDataOld, alertsDataNew);
content = content.replace(processedAlertsOld, processedAlertsNew);
content = content.replace(statsOld, statsNew);
content = content.replace(filteredAlertsOld, filteredAlertsNew);

// Write the fixed content back
fs.writeFileSync(dashboardPath, content, 'utf8');

console.log('✅ EnhancedDashboard.jsx has been fixed!');
console.log('The following defensive fixes were applied:');
console.log('1. alertsData now handles non-array activeAlerts');
console.log('2. processedAlerts always returns valid structure');
console.log('3. stats calculation has null checks');
console.log('4. filteredAlerts has defensive checks');
console.log('\nPlease refresh the app to see the fixes in action.');