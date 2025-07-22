# Route Confidence Display Integration Example

## For Incident Cards

To add route confidence display to incident cards, update your incident display component:

```javascript
// In your incident display component (e.g., IncidentCard.jsx)
import RouteConfidenceDisplay from '../RouteConfidenceDisplay';

// Inside your component render:
const IncidentCard = ({ incident }) => {
  return (
    <View style={styles.card}>
      {/* Existing incident info */}
      <Text style={styles.title}>{incident.title}</Text>
      <Text style={styles.location}>{incident.location}</Text>
      
      {/* Add Route Confidence Display */}
      {incident.routeMatching && (
        <RouteConfidenceDisplay 
          routeMatching={incident.routeMatching}
          multiModalImpacts={incident.multiModalImpacts}
        />
      )}
      
      {/* Or show simple high-confidence routes only */}
      {incident.routeMatching?.highConfidence && (
        <View style={styles.routesSection}>
          <Text style={styles.routesTitle}>Affected Routes (High Confidence)</Text>
          <View style={styles.routeTags}>
            {incident.routeMatching.highConfidence.map(route => (
              <View key={route.route} style={styles.routeTag}>
                <Text style={styles.routeNumber}>{route.route}</Text>
                <Text style={styles.confidence}>{Math.round(route.confidence * 100)}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
```

## For Incident Detail Views

For detailed incident views, show the full confidence display:

```javascript
// In your incident detail view
import RouteConfidenceDisplay from '../RouteConfidenceDisplay';

const IncidentDetailView = ({ incident }) => {
  return (
    <ScrollView>
      {/* Incident header info */}
      <View style={styles.header}>
        <Text style={styles.title}>{incident.title}</Text>
        <Text style={styles.severity}>{incident.severity}</Text>
      </View>
      
      {/* Full route confidence display */}
      <RouteConfidenceDisplay 
        routeMatching={incident.routeMatching}
        multiModalImpacts={incident.multiModalImpacts}
      />
      
      {/* Multi-modal warnings */}
      {incident.multiModalImpacts?.hasMultiModalImpact && (
        <View style={styles.warningBox}>
          <Icon name="warning" size={24} color="#f59e0b" />
          <Text style={styles.warningText}>
            This incident affects Metro/Ferry connections. 
            Expect cascading delays across the network.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};
```

## For Alert Lists

Show confidence indicators in alert lists:

```javascript
// In your alert list item
const AlertListItem = ({ alert }) => {
  const highConfidenceRoutes = alert.routeMatching?.highConfidence || [];
  const hasMultiModal = alert.multiModalImpacts?.hasMultiModalImpact;
  
  return (
    <View style={styles.alertItem}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertTitle}>{alert.title}</Text>
        {hasMultiModal && <Icon name="hub" size={16} color="#f59e0b" />}
      </View>
      
      {/* Show high confidence routes inline */}
      {highConfidenceRoutes.length > 0 && (
        <View style={styles.inlineRoutes}>
          <Icon name="route" size={14} color="#6b7280" />
          <Text style={styles.routesText}>
            Routes: {highConfidenceRoutes.slice(0, 3).map(r => r.route).join(', ')}
            {highConfidenceRoutes.length > 3 && ` +${highConfidenceRoutes.length - 3}`}
          </Text>
        </View>
      )}
    </View>
  );
};
```

## API Response Structure

The enhanced alerts from TomTom will now include:

```javascript
{
  id: "tomtom_enhanced_123",
  title: "Accident - Monument Metro Station",
  location: "Monument Metro Station, Newcastle",
  coordinates: [54.973556, -1.612778],
  affectsRoutes: ["Q3", "Q3X", "1", "2"], // High confidence routes only
  
  // NEW: Route matching details
  routeMatching: {
    highConfidence: [
      { route: "Q3", confidence: 0.95, matchType: "direct", distance: 20 },
      { route: "Q3X", confidence: 0.92, matchType: "direct", distance: 20 }
    ],
    mediumConfidence: [
      { route: "22", confidence: 0.65, matchType: "proximity", distance: 150 }
    ],
    multiModalImpacts: {
      hasMultiModalImpact: true,
      metro: [{ station: "Monument Metro", distance: 20, lines: ["Yellow", "Green"] }],
      cascadingRoutes: ["40", "62", "63"]
    },
    serviceContext: ["weekday", "peak"]
  }
}
```

## Styling Examples

```javascript
const styles = StyleSheet.create({
  routeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  routeNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  confidence: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    color: '#92400e',
  },
});
```
