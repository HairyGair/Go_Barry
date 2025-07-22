# Driver Notification System via Blink
*Part of Phase 1 Implementation*

## Overview
Since drivers receive information via:
1. **Ticketer** - Real-time messages while driving (future integration)
2. **Blink** - Planned disruptions (roadworks, events) known in advance

We'll focus on Blink export functionality first.

## Blink Export Requirements

### Data Format
Blink requires structured data for planned disruptions:
```javascript
{
  "disruption_id": "RW-2025-001",
  "type": "ROADWORK",
  "title": "A167 Durham Road - Gas Works",
  "description": "3-way temporary lights causing delays",
  "affected_routes": ["21", "X21", "X12"],
  "start_date": "2025-01-20",
  "end_date": "2025-01-24",
  "severity": "MEDIUM",
  "diversion": {
    "route_21": "Via Chester Road and rejoin at Birtley",
    "route_X21": "Normal route - expect 10 min delays"
  },
  "depot": "Chester-le-Street",
  "created_by": "AG003",
  "created_at": "2025-01-15T09:00:00Z"
}
```

### Implementation Steps

#### 1. Backend API Endpoint
Create `/api/export/blink` endpoint:
```javascript
// GET /api/export/blink?type=roadworks&days=7
// Returns upcoming disruptions in Blink format

router.get('/export/blink', authenticate, async (req, res) => {
  const { type = 'all', days = 7 } = req.query;
  
  // Get roadworks/events for next X days
  const disruptions = await getUpcomingDisruptions(type, days);
  
  // Format for Blink
  const blinkData = formatForBlink(disruptions);
  
  res.json({
    success: true,
    export_date: new Date(),
    disruption_count: blinkData.length,
    data: blinkData
  });
});
```

#### 2. Frontend Export Interface
Add to RoadworksManagerV2.jsx:
```javascript
// Export button in toolbar
<Button
  title="Export to Blink"
  icon="export"
  onPress={handleBlinkExport}
/>

// Export modal
<Modal visible={showExportModal}>
  <Text>Export Roadworks to Blink</Text>
  <Picker
    selectedValue={exportDays}
    onValueChange={setExportDays}
  >
    <Picker.Item label="Next 7 days" value="7" />
    <Picker.Item label="Next 14 days" value="14" />
    <Picker.Item label="Next 30 days" value="30" />
  </Picker>
  <Button title="Download Export" onPress={downloadBlinkFile} />
</Modal>
```

#### 3. Automated Daily Export
Set up scheduled job:
```javascript
// Daily at 5 AM - export next 7 days
schedule.scheduleJob('0 5 * * *', async () => {
  const blinkData = await generateBlinkExport(7);
  
  // Save to designated location
  await saveBlinkExport(blinkData);
  
  // Notify control room
  await notifyExportComplete(blinkData.length);
});
```

### Export Features

1. **Manual Export**
   - On-demand export from dashboard
   - Selectable date range
   - Preview before export

2. **Automated Export**
   - Daily scheduled export
   - Configurable time and range
   - Email notification when complete

3. **Export Formats**
   - JSON (for system integration)
   - CSV (for manual review)
   - PDF (for printing/briefings)

4. **Filtering Options**
   - By depot
   - By severity
   - By route
   - By date range

### Future: Ticketer Integration
When contact with Ticketer established:
```javascript
// Real-time push to Ticketer API
async function sendToTicketer(alert) {
  const ticketerPayload = {
    message: alert.description,
    routes: alert.affected_routes,
    priority: alert.severity > 7 ? 'HIGH' : 'NORMAL',
    duration: alert.estimated_duration
  };
  
  await ticketerAPI.pushMessage(ticketerPayload);
}
```

## Success Metrics
- ✅ Daily Blink exports generated successfully
- ✅ All planned disruptions included
- ✅ Drivers receive information before shift start
- ✅ Reduced radio queries about known disruptions

## Timeline
- Week 1: Backend export endpoint
- Week 2: Frontend export interface
- Week 3: Automated daily exports
- Week 4: Testing with actual Blink import
