# Phase 1 Coordinate Accuracy Improvements

## Overview

This document outlines the Phase 1 coordinate accuracy improvements implemented for the Go BARRY system to fix issues where alerts without coordinates were returning incorrect location results ("nowhere near where it's supposed to be").

## Problem Statement

The existing system had accuracy issues with:
- Street Manager alerts lacking precise coordinates
- Vague location descriptions being geocoded incorrectly
- No fallback mechanisms for failed coordinate lookups
- Low confidence in coordinate accuracy (80-90% baseline)

## Solution Architecture

### Enhanced Coordinate Service (`enhancedCoordinateService.js`)

A comprehensive coordinate resolution system with 5-phase fallback strategy:

#### Phase 1: Enhanced Street Manager Coordinate Extraction
- **BNG Direct**: Direct conversion of `sm_easting`/`sm_northing` to WGS84
- **Geometry Parsing**: Parse `works_location_coordinates` (POINT/POLYGON/LINESTRING)
- **Boundary Data**: Extract from `work_boundary` polygon data
- **Confidence**: 90-95%

#### Phase 2: Postcode-to-Coordinate Conversion
- **Postcode Extraction**: Multiple regex patterns for UK postcodes (NE, DH, SR codes)
- **Ordnance Survey API**: FREE CodePoint API for precise UK postcode lookup
- **Free Fallback**: postcodes.io as backup service
- **Confidence**: 88-92%

#### Phase 3: USRN (Unique Street Reference Number) Lookup
- **USRN Extraction**: Extract 8-digit USRN codes from descriptions
- **Database Lookup**: Convert USRN to coordinates (requires OS licensing)
- **Status**: Implemented but requires data licensing
- **Confidence**: 85-90%

#### Phase 4: Multi-Service Geocoding Chain
- **HERE API**: Primary geocoding (best for UK)
- **OpenStreetMap Nominatim**: Secondary fallback
- **MapBox**: Final geocoding fallback
- **Confidence**: 70-85%

#### Phase 5: Enhanced Known Locations
- **Expanded Database**: 50+ precise North East locations
- **Fuzzy Matching**: Road number and area matching
- **High Accuracy**: Major transport hubs, business parks
- **Confidence**: 95-98%

## Key Features

### Confidence Scoring System (0-100%)
- **95-100%**: GPS/Survey-grade coordinates
- **85-94%**: High-confidence geocoding (postcodes, known locations)
- **70-84%**: Medium-confidence geocoding (HERE, BNG conversion)
- **50-69%**: Lower-confidence geocoding (Nominatim, MapBox)
- **10-49%**: Fallback/default coordinates
- **0-9%**: Failed coordinate resolution

### Memory Optimization
- **LRU Caching**: 30-minute cache with 1000 coordinate / 500 postcode entries
- **Batch Processing**: Process streetworks in 50-record batches
- **Request Rate Limiting**: Prevent API overload
- **Memory Efficient**: Designed for 2GB RAM constraint

### UK-Specific Enhancements
- **Postcode Patterns**: NE (Newcastle), DH (Durham), SR (Sunderland) specific patterns
- **Regional Validation**: Coordinate bounds checking for North East England
- **Local Knowledge**: Transport hubs, business districts, major roads

## Integration Points

### UnifiedRoadworksManager Integration
```javascript
// Enhanced transformation with coordinate service
const roadwork = await enhancedCoordinateService.enhanceAlertCoordinates(alert);

// Result includes:
// - coordinates: [lat, lng]
// - coordinateSource: 'streetmanager_bng_direct' | 'ordnance_survey_codepoint' | etc.
// - coordinateConfidence: 0-100
// - geocodingMetadata: { method, source, accuracy info }
```

### Backward Compatibility
- Existing geocoding service remains functional
- Legacy confidence mapping: 'high' → 85, 'medium' → 70, 'low' → 55
- Gradual migration path for existing alerts

## API Configuration

### Required Environment Variables
```bash
# Primary geocoding service
HERE_API_KEY=your_here_api_key

# Fallback services
MAPBOX_TOKEN=your_mapbox_token

# Optional: Ordnance Survey (uses free tier by default)
OS_API_KEY=your_os_api_key
```

### Service Endpoints Used
- **HERE Geocoding**: `geocode.search.hereapi.com/v1/geocode`
- **Ordnance Survey**: `api.ordnancesurvey.co.uk/places/v1/addresses/postcode` (free tier)
- **Postcodes.io**: `api.postcodes.io/postcodes/` (free)
- **Nominatim**: `nominatim.openstreetmap.org/search` (free)
- **MapBox**: `api.mapbox.com/geocoding/v5/mapbox.places/` (existing)

## Testing

### Test Suite (`coordinateAccuracyTest.js`)
- **15 Test Cases**: Real-world scenarios from Newcastle/Gateshead/Durham
- **Postcode Tests**: Extract and geocode UK postcodes
- **Road Location Tests**: A1, A19, A167 major routes
- **Geometry Tests**: BNG coordinate conversion
- **Edge Cases**: Vague descriptions, unknown locations

### Running Tests
```bash
cd backend
node tests/coordinateAccuracyTest.js
```

### Success Criteria
- **Target**: 80% pass rate with regional accuracy
- **Performance**: <1000ms average processing time
- **Memory**: Efficient caching and batch processing

## Performance Metrics

### Before Phase 1
- **Accuracy**: 80-90% baseline
- **Issue**: Alerts "nowhere near where it's supposed to be"
- **Coverage**: Limited to MapBox geocoding only
- **Confidence**: Basic string-based confidence levels

### After Phase 1 (Expected)
- **Accuracy**: 90-95% target
- **Issue Resolution**: Multiple fallback sources prevent incorrect locations  
- **Coverage**: 5-phase fallback chain with UK-specific optimizations
- **Confidence**: Numeric 0-100% scoring with source tracking

## Deployment Checklist

1. **Environment Setup**
   - [ ] Configure HERE_API_KEY for primary geocoding
   - [ ] Verify MAPBOX_TOKEN for fallback
   - [ ] Test Ordnance Survey free tier access

2. **Service Integration**
   - [ ] Deploy enhancedCoordinateService.js
   - [ ] Update unifiedRoadworksManager.js with async transformations
   - [ ] Verify backward compatibility with existing geocoding

3. **Testing & Validation**
   - [ ] Run coordinate accuracy test suite
   - [ ] Verify 80%+ pass rate on test cases
   - [ ] Monitor memory usage under 2GB constraint
   - [ ] Test with real Street Manager webhook data

4. **Monitoring**
   - [ ] Track coordinate confidence scores in alerts
   - [ ] Monitor geocoding service usage and costs
   - [ ] Validate regional accuracy for supervisor workflows

## Usage Examples

### Basic Alert Enhancement
```javascript
import enhancedCoordinateService from './services/enhancedCoordinateService.js';

const alert = {
  id: 'SW123456',
  location: 'High Street, Newcastle NE1 6PA',
  sm_easting: 424500,
  sm_northing: 564200
};

const enhanced = await enhancedCoordinateService.enhanceAlertCoordinates(alert);
// Result: coordinates [54.9742, -1.6142], confidence: 92%, source: 'ordnance_survey_codepoint'
```

### Service Statistics
```javascript
const stats = enhancedCoordinateService.getStats();
console.log(`Success Rate: ${stats.successRate}`);
console.log(`Cache Hit Rate: ${stats.cacheHitRate}`);
console.log(`Cache Size: ${stats.cacheSize} entries`);
```

## Future Enhancements (Phase 2+)

1. **USRN Database Integration**: Full Ordnance Survey street reference lookup
2. **Machine Learning**: Historical accuracy learning for location patterns
3. **Route Context**: Use affected bus routes to validate coordinate accuracy
4. **Real-time Validation**: Cross-validate coordinates with traffic camera feeds
5. **Supervisor Feedback**: Learn from supervisor corrections to improve accuracy

## Troubleshooting

### Common Issues

**Low Confidence Scores**
- Check if location descriptions contain postcodes or road numbers
- Verify API keys for HERE and other services
- Review known locations database for coverage gaps

**Memory Usage**
- Monitor cache sizes with `getStats()`
- Clear caches with `clearCaches()` if needed
- Reduce batch size in unifiedRoadworksManager if memory constraints

**API Rate Limits**
- Services implement rate limiting (10 req/sec for MapBox)
- Cache is designed to reduce API calls
- Consider upgrading API tiers if needed

**Regional Accuracy**
- Test with known North East England locations
- Validate coordinate bounds (49-61°N, -8-2°W for UK)
- Check regional validation in test cases

## Files Modified/Created

### New Files
- `/backend/services/enhancedCoordinateService.js` - Main coordinate enhancement service
- `/backend/tests/coordinateAccuracyTest.js` - Comprehensive test suite
- `/backend/PHASE1_COORDINATE_IMPROVEMENTS.md` - This documentation

### Modified Files  
- `/backend/services/unifiedRoadworksManager.js` - Integration with enhanced service
- `/backend/services/geocoding.js` - Legacy compatibility and confidence mapping

## Contact & Support

For issues related to coordinate accuracy improvements:
- Review test results with `node tests/coordinateAccuracyTest.js`
- Check service statistics with `enhancedCoordinateService.getStats()`
- Monitor supervisor feedback for location accuracy in production
- Consider Phase 2 enhancements for persistent accuracy issues