# 🗺️ Coordinate System Refactoring Plan
**Date**: January 2025  
**Goal**: Consolidate 6+ coordinate services into a single, efficient system

## 📊 Current State Analysis

### Problems Identified
1. **Service Sprawl** (6+ services):
   - `enhancedCoordinateService.js`
   - `coordinateCacheService.js`
   - `coordinateVerificationService.js`
   - `intelligentCoordinateResolver.js`
   - `batchCoordinateProcessor.js`
   - `coordinateEnhancer.js`

2. **Cache Fragmentation** (4 systems):
   - LRU Memory Cache (30 min TTL)
   - Supabase Cache (30 days TTL)
   - Redis Cache (5 min TTL)
   - Offline Cache (7 days TTL)

3. **Precision Inconsistency**:
   - Mix of 4, 6, and 7 decimal places
   - No standard rounding strategy

4. **Redundant Conversions**:
   - BNG→WGS84 happening in multiple places
   - No deduplication of conversion requests

## 🎯 Target Architecture

### Single Service Design
```
coordinateService.js
├── Validation Layer
├── Conversion Layer (BNG→WGS84)
├── Enhancement Layer (Geocoding)
├── Cache Layer (Unified)
└── Output Formatting
```

### Unified Cache Strategy
```
Level 1: Memory (5 min) - Hot data
Level 2: Redis (1 hour) - Shared across instances
Level 3: Database (30 days) - Persistent storage
```

### Precision Standard
- **6 decimal places** (0.11m accuracy)
- Suitable for roadwork precision
- Consistent across all operations

## 📝 Implementation Phases

### Phase 1: Create Unified Service ✅
- [x] Create new `coordinateService.js`
- [x] Implement validation layer
- [x] Implement conversion layer
- [x] Implement enhancement layer
- [x] Implement unified cache
- [x] Create database migration

### Phase 2: Integration Points ✅
- [x] Update `unifiedRoadworksManager.js` - Using new coordinateService
- [x] Create new coordinate API endpoints
- [x] Register routes in index.js
- [x] Update `streetManagerProcessor.js` - Using unified service
- [x] Create frontend `unifiedCoordinateService.js`
- [x] Update `RoadworksManagerDashboard.jsx` imports

### Phase 3: Migration
- [ ] Replace old service calls
- [ ] Remove deprecated services
- [ ] Update tests
- [ ] Update documentation

### Phase 4: Cleanup
- [ ] Delete old coordinate services
- [ ] Remove redundant cache systems
- [ ] Clean up hardcoded coordinates
- [ ] Optimize database queries

## 🔧 Technical Implementation

### 1. Unified CoordinateService Class
```javascript
class CoordinateService {
  constructor() {
    this.memoryCache = new LRUCache(1000, 5 * 60 * 1000); // 5 min
    this.precision = 6; // Standard precision
  }
  
  async processCoordinate(input) {
    // Single entry point for all coordinate operations
  }
  
  async validate(coords) {
    // Validation logic
  }
  
  async convert(coords, fromSystem, toSystem) {
    // Conversion logic (BNG→WGS84)
  }
  
  async enhance(location) {
    // Geocoding and enhancement
  }
  
  formatOutput(coords) {
    // Consistent formatting
  }
}
```

### 2. Cache Key Strategy
```javascript
// Consistent cache key generation
generateCacheKey(input) {
  if (input.id) return `coord:id:${input.id}`;
  if (input.usrn) return `coord:usrn:${input.usrn}`;
  if (input.location) return `coord:loc:${hash(input.location)}`;
  return `coord:raw:${hash(JSON.stringify(input))}`;
}
```

### 3. Fallback Chain
```javascript
Priority Order:
1. Exact coordinates from source
2. Cached coordinates (check all levels)
3. BNG conversion if available
4. Geocoding from address/postcode
5. Known location lookup
6. Area centroid (last resort)
```

## 📋 Migration Checklist

### Backend Updates
- [ ] Create new `coordinateService.js`
- [ ] Update `unifiedRoadworksManager.js` to use new service
- [ ] Update `streetManagerWebhook.js` to use new service
- [ ] Update all API routes in `/routes/`
- [ ] Update batch processors
- [ ] Update test suites

### Frontend Updates
- [ ] Update `RoadworksManagerDashboard.jsx`
- [ ] Update `RoadworkMapModal.jsx`
- [ ] Update `offlineCoordinateCache.js`
- [ ] Update coordinate display components

### Database Updates
- [ ] Standardize coordinate columns to 6 decimals
- [ ] Clean up duplicate cache entries
- [ ] Add indexes for coordinate queries

### Testing
- [ ] Unit tests for new service
- [ ] Integration tests for API endpoints
- [ ] E2E tests for coordinate display
- [ ] Performance benchmarks

## 📈 Success Metrics

### Performance
- **Cache Hit Rate**: Target 85%+
- **Conversion Time**: <50ms average
- **API Response**: <200ms for coordinate operations

### Accuracy
- **Precision**: Consistent 6 decimal places (0.11m)
- **Validation Rate**: 100% of coordinates validated
- **Enhancement Success**: 70%+ addresses geocoded

### Code Quality
- **Service Count**: 6+ → 1 unified service
- **Code Lines**: 50% reduction expected
- **Test Coverage**: 90%+ for new service

## 🚀 Rollout Strategy

### Week 1
- Implement new coordinateService.js
- Add comprehensive tests
- Deploy alongside existing services

### Week 2
- Migrate high-traffic endpoints
- Monitor performance metrics
- Fix any issues

### Week 3
- Complete migration
- Remove old services
- Update documentation

### Week 4
- Performance optimization
- Final cleanup
- Release notes

## ⚠️ Risk Mitigation

### Risks
1. **Data Loss**: Backup all coordinate data before migration
2. **Downtime**: Use feature flags for gradual rollout
3. **Precision Issues**: Validate all conversions match expected output
4. **Cache Invalidation**: Clear all caches during migration

### Rollback Plan
1. Keep old services available for 30 days
2. Feature flag to switch between old/new
3. Database backups before any schema changes
4. Monitoring alerts for coordinate accuracy

## 📝 Notes

- Priority on backward compatibility
- No breaking changes to API contracts
- Gradual migration with monitoring
- Focus on North East England coordinates (lat: 54-56, lng: -2 to 0)

## 🎯 Definition of Done

- [ ] Single coordinate service handles all operations
- [ ] Unified cache with 3-tier strategy
- [ ] Consistent 6 decimal precision
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Old services removed
- [ ] Performance metrics met
