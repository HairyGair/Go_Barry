// Add these tables to your existing schema.ts file

// Bus locations from BODS API
buses: defineTable({
  // Vehicle identification
  vehicleId: v.string(),
  vehicleRef: v.string(),
  
  // Operator
  operatorRef: v.string(),
  
  // Service information
  lineRef: v.string(),
  lineName: v.string(),
  directionRef: v.string(),
  directionName: v.optional(v.string()),
  
  // Destination
  destinationRef: v.optional(v.string()),
  destinationName: v.string(),
  
  // Position
  latitude: v.number(),
  longitude: v.number(),
  bearing: v.number(),
  
  // Journey matching
  blockRef: v.optional(v.string()),
  vehicleJourneyRef: v.optional(v.string()),
  
  // Origin info
  originRef: v.optional(v.string()),
  originName: v.optional(v.string()),
  originAimedDeparture: v.optional(v.string()),
  
  // Status
  delay: v.number(), // minutes
  status: v.union(
    v.literal('on-time'),
    v.literal('delayed'),
    v.literal('severely-delayed'),
    v.literal('early')
  ),
  
  // Timestamps
  recordedAt: v.string(),
  validUntil: v.optional(v.string()),
  lastUpdated: v.string(),
  
  // Optional
  occupancy: v.optional(v.string()),
})
.index("by_vehicle", ["vehicleId"])
.index("by_line", ["lineRef"])
.index("by_status", ["status"])
.index("by_location", ["latitude", "longitude"])
.index("by_operator", ["operatorRef"]),

busUpdateLog: defineTable({
  timestamp: v.string(),
  busCount: v.number(),
  updateDuration: v.number(), // milliseconds
  errors: v.optional(v.string()),
})
.index("by_timestamp", ["timestamp"]),
