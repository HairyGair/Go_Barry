// Example: Migrating a Component to Convex
// Before (using polling/WebSocket) → After (using Convex)

// ❌ BEFORE - Old polling approach
import { useState, useEffect } from 'react';
import { useSupervisorSync } from '../hooks/useSupervisorSync';

function OldComponent() {
  const [alerts, setAlerts] = useState([]);
  const { syncState, dismissAlert } = useSupervisorSync();
  
  // Polling every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch('https://go-barry.onrender.com/api/alerts-enhanced');
      const data = await response.json();
      setAlerts(data.data);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleDismiss = async (alertId) => {
    await dismissAlert(alertId);
    // Manually update local state
    setAlerts(alerts.filter(a => a.id !== alertId));
  };
  
  return (
    <View>
      {alerts.map(alert => (
        <TouchableOpacity key={alert.id} onPress={() => handleDismiss(alert.id)}>
          <Text>{alert.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ✅ AFTER - Convex approach (real-time, no polling!)
import { useConvexSync } from '../hooks/useConvexSync';

function NewComponent() {
  const { 
    activeAlerts,        // Real-time data, no polling needed!
    dismissFromDisplay,  // Mutations update all clients instantly
    session 
  } = useConvexSync();
  
  const handleDismiss = async (alertId) => {
    // Just call the mutation - UI updates everywhere automatically
    await dismissFromDisplay({ 
      alertId, 
      sessionId: session._id 
    });
  };
  
  return (
    <View>
      {activeAlerts.map(alert => (
        <TouchableOpacity 
          key={alert.alertId} 
          onPress={() => handleDismiss(alert.alertId)}
        >
          <Text>{alert.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// 🎯 Key Benefits:
// 1. No polling intervals to manage
// 2. No manual state updates
// 3. No CORS issues
// 4. Instant updates across all clients
// 5. Automatic reconnection
// 6. Type-safe with TypeScript
