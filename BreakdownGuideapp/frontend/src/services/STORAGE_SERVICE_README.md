# Storage Service Documentation

## Overview

The Storage Service provides a comprehensive solution for managing local data storage in the Go North East Breakdown Management System. It handles offline capability, caching, user preferences, and session data.

## 🗄️ Storage Architecture

```
Supabase (Primary Storage)
    ↓
Storage Service (Local Cache)
    ├── LocalStorage (Persistent)
    │   ├── Frequent Routes
    │   ├── Recent Locations
    │   ├── User Preferences
    │   └── Route Cache (GTFS)
    └── SessionStorage (Temporary)
        ├── Activity Feed
        └── Current Session Data
```

## 📦 Features

### 1. **Breakdown Draft Management**
- Auto-saves form progress
- Recovers incomplete submissions after connection loss
- 24-hour retention period

### 2. **Frequent Routes Tracking**
- Tracks most-used routes
- Provides quick-select buttons
- Automatically sorts by usage

### 3. **Activity Feed Caching**
- Stores recent activities
- Persists across page refreshes
- 10-minute cache duration

### 4. **Recent Data Lists**
- Recent fleet numbers
- Recent breakdown locations
- Quick autocomplete suggestions

### 5. **User Preferences**
- Theme settings
- Default depot
- Notification preferences

## 🚀 Quick Start

### Basic Usage

```javascript
import storageService from '../services/storageService';

// Save a draft
storageService.saveDraft({
  fleetNumber: '5801',
  route: 'X10',
  location: 'Gateshead Interchange'
});

// Get frequent routes
const topRoutes = storageService.getTopRoutes(6);

// Save recent location
storageService.saveRecentLocation({
  description: 'A1 Northbound',
  coordinates: { lat: 54.9567, lng: -1.5897 }
});
```

### Using React Hooks

```javascript
import { useFrequentRoutes, useBreakdownDraft } from '../hooks/useStorage';

function MyComponent() {
  const { topRoutes, updateRoute } = useFrequentRoutes();
  const { draft, saveDraft, clearDraft } = useBreakdownDraft();
  
  // Use in your component
  const handleRouteSelect = (routeId) => {
    updateRoute(routeId, 'Route Name');
  };
}
```

## 🔄 Data Flow

### Saving a Breakdown

```javascript
// 1. Collect data in wizard steps
const breakdownData = {
  fleetNumber: '5801',
  route: 'X10',
  location: 'Gateshead Interchange',
  passengersOnBoard: true,
  issueType: 'Won\'t start'
};

// 2. Save to storage service (auto-saves draft)
storageService.saveDraft(breakdownData);

// 3. Submit to Supabase
const { data, error } = await supabase
  .from('breakdowns')
  .insert(breakdownData);

// 4. Update frequent routes
storageService.updateFrequentRoutes(breakdownData.route);

// 5. Add to activity feed
storageService.addActivityItem({
  ...breakdownData,
  timestamp: new Date().toISOString()
});

// 6. Clear draft on success
if (data) {
  storageService.clearDraft();
}
```

### Activity Feed Display

```javascript
// Activity feed dynamically shows different info based on status
const formatActivityText = (activity) => {
  const status = getStatusColor(activity.status);
  
  if (status === 'amber') {
    // Show route and location
    return `Route ${activity.route} • ${activity.location}`;
  } else if (status === 'stop') {
    // Show issue and passenger status
    const passengerText = activity.passengersOnBoard ? 
      'Passengers on board' : 'No passengers';
    return `${activity.issue} • ${passengerText}`;
  } else {
    // Show resolution status
    return `Engineer assigned • Route ${activity.route}`;
  }
};
```

## 📋 Storage Keys

| Key | Purpose | Storage Type | Duration |
|-----|---------|--------------|----------|
| `gne_breakdown_draft` | Form draft | LocalStorage | 24 hours |
| `gne_frequent_routes` | Top routes | LocalStorage | Permanent |
| `gne_cached_breakdowns` | Breakdown list | LocalStorage | 1 hour |
| `gne_activity_feed` | Live feed | SessionStorage | 10 minutes |
| `gne_recent_locations` | Location history | LocalStorage | Permanent |
| `gne_recent_fleet` | Fleet numbers | LocalStorage | Permanent |
| `gne_route_cache` | GTFS routes | LocalStorage | 24 hours |

## 🛠️ Utility Functions

### Storage Management

```javascript
// Check storage usage
const info = storageService.getStorageInfo();
console.log(`Using ${info.totalSizeKB}KB of storage`);

// Clear old cache (7+ days)
storageService.clearOldCache();

// Export all data (for debugging)
const allData = storageService.exportData();
console.log(allData);

// Clear everything
storageService.clearAll();
```

### Debug Mode

In development, access storage service from console:
```javascript
// Available in browser console
window.gneStorage.getStorageInfo();
window.gneStorage.exportData();
```

## 🔗 Integration Points

### 1. Fleet Selection Modal
- Add route selection UI
- Save frequent routes
- Auto-save drafts

### 2. Activity Feed
- Display dynamic content based on status
- Cache for offline viewing
- Real-time updates via events

### 3. Breakdown Wizard
- Resume incomplete forms
- Track common inputs
- Quick-select options

## 🎯 Next Steps

1. **Add GTFS Data**
   - Place GTFS files in `/frontend/src/data/gtfs/`
   - Process routes.txt for dropdown

2. **Update Fleet Selection Modal**
   - Add route selection UI
   - Implement quick-select buttons
   - Connect to storage service

3. **Update Activity Feed**
   - Replace "Unknown" with route/location
   - Implement dynamic status display
   - Connect to storage events

4. **Add to Breakdown Wizard**
   - Passenger status radio buttons
   - Simplified issue dropdown
   - Auto-save progress

## 📝 Example Implementation

See `/src/components/examples/StorageIntegrationExample.jsx` for:
- Complete fleet selection modal with routes
- Activity feed with dynamic display
- Storage service integration

## 🐛 Troubleshooting

### Storage Full
```javascript
// Error: QuotaExceededError
// Solution: Clear old cache
storageService.clearOldCache();
```

### Draft Not Saving
```javascript
// Check if localStorage is enabled
if (typeof(Storage) === "undefined") {
  console.error("No localStorage support");
}
```

### Routes Not Appearing
```javascript
// Initialize with defaults
storageService.initializeStorage();
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [LocalStorage MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [React Hooks Guide](https://react.dev/reference/react)

---

**Note:** The storage service is designed to work offline-first. All critical data is saved locally before attempting to sync with Supabase, ensuring no data loss during connection issues.