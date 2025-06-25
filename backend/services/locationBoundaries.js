// backend/services/locationBoundaries.js
// Location boundary definitions for accurate geocoding validation

class LocationBoundariesService {
  constructor() {
    // Define polygon boundaries for key Newcastle/Gateshead areas
    // Coordinates in [latitude, longitude] format
    this.boundaries = {
      westerhope: {
        name: 'Westerhope',
        type: 'polygon',
        center: [54.9952, -1.7090],
        bounds: [
          [55.0100, -1.7400], // NW
          [55.0100, -1.6800], // NE
          [54.9800, -1.6800], // SE
          [54.9800, -1.7400]  // SW
        ]
      },
      ryton: {
        name: 'Ryton',
        type: 'polygon', 
        center: [54.9649, -1.7638],
        bounds: [
          [54.9800, -1.7900], // NW
          [54.9800, -1.7400], // NE
          [54.9500, -1.7400], // SE
          [54.9500, -1.7900]  // SW
        ]
      },
      newcastle: {
        name: 'Newcastle City Centre',
        type: 'polygon',
        center: [54.9783, -1.6178],
        bounds: [
          [55.0000, -1.6500], // NW
          [55.0000, -1.5800], // NE
          [54.9600, -1.5800], // SE
          [54.9600, -1.6500]  // SW
        ]
      },
      gateshead: {
        name: 'Gateshead',
        type: 'polygon',
        center: [54.9527, -1.6032],
        bounds: [
          [54.9700, -1.6300], // NW
          [54.9700, -1.5700], // NE
          [54.9300, -1.5700], // SE
          [54.9300, -1.6300]  // SW
        ]
      },
      sunderland: {
        name: 'Sunderland City Centre',
        type: 'polygon',
        center: [54.9069, -1.3838],
        bounds: [
          [54.9300, -1.4100], // NW
          [54.9300, -1.3500], // NE
          [54.8800, -1.3500], // SE
          [54.8800, -1.4100]  // SW
        ]
      },
      durham: {
        name: 'Durham City',
        type: 'polygon',
        center: [54.7761, -1.5733],
        bounds: [
          [54.8000, -1.6000], // NW
          [54.8000, -1.5400], // NE
          [54.7500, -1.5400], // SE
          [54.7500, -1.6000]  // SW
        ]
      },
      // Major road corridors
      a1_corridor: {
        name: 'A1 Corridor',
        type: 'corridor',
        buffer: 0.01, // ~1km buffer around road
        points: [
          [55.0500, -1.6000], // North of Newcastle
          [54.9783, -1.6178], // Newcastle
          [54.9527, -1.6032], // Gateshead
          [54.8500, -1.5800], // Chester-le-Street
          [54.7761, -1.5733]  // Durham
        ]
      },
      a19_corridor: {
        name: 'A19 Corridor',
        type: 'corridor',
        buffer: 0.01,
        points: [
          [55.0200, -1.4500], // North Tyneside
          [54.9800, -1.4300], // Wallsend
          [54.9500, -1.4200], // Tyne Tunnel
          [54.9069, -1.3838], // Sunderland
          [54.8500, -1.3700]  // South of Sunderland
        ]
      }
    };

    // Common area aliases and misspellings
    this.aliases = {
      'westerhope': ['wester hope', 'westerhope village', 'west erhope'],
      'ryton': ['ryton village', 'ryton on tyne', 'ryton-on-tyne'],
      'newcastle': ['newcastle upon tyne', 'newcastle city', 'ncl'],
      'gateshead': ['gateshead town', 'gateshead centre'],
      'sunderland': ['sunderland city', 'sunderland centre'],
      'durham': ['durham city', 'durham cathedral']
    };
  }

  // Check if coordinates fall within a specific boundary
  isWithinBoundary(lat, lon, boundaryKey) {
    const boundary = this.boundaries[boundaryKey];
    if (!boundary) return false;

    if (boundary.type === 'polygon') {
      return this.isPointInPolygon(lat, lon, boundary.bounds);
    } else if (boundary.type === 'corridor') {
      return this.isPointNearCorridor(lat, lon, boundary.points, boundary.buffer);
    }

    return false;
  }

  // Point-in-polygon algorithm (ray casting)
  isPointInPolygon(lat, lon, polygon) {
    let inside = false;
    const x = lat, y = lon;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  // Check if point is near a corridor (series of points with buffer)
  isPointNearCorridor(lat, lon, corridorPoints, buffer) {
    for (let i = 0; i < corridorPoints.length - 1; i++) {
      const dist = this.distanceToLineSegment(
        lat, lon,
        corridorPoints[i][0], corridorPoints[i][1],
        corridorPoints[i + 1][0], corridorPoints[i + 1][1]
      );
      
      if (dist <= buffer) return true;
    }
    return false;
  }

  // Calculate distance from point to line segment
  distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Find which boundary contains the given coordinates
  findContainingBoundary(lat, lon) {
    for (const [key, boundary] of Object.entries(this.boundaries)) {
      if (this.isWithinBoundary(lat, lon, key)) {
        return {
          key,
          name: boundary.name,
          center: boundary.center
        };
      }
    }
    return null;
  }

  // Validate location description against coordinates
  validateLocationDescription(description, lat, lon) {
    const descLower = description.toLowerCase();
    
    // Check each boundary and its aliases
    for (const [key, aliases] of Object.entries(this.aliases)) {
      const allNames = [key, ...aliases];
      
      for (const name of allNames) {
        if (descLower.includes(name)) {
          // Location mentions this area - check if coordinates match
          const isCorrect = this.isWithinBoundary(lat, lon, key);
          
          if (!isCorrect) {
            // Find actual boundary
            const actualBoundary = this.findContainingBoundary(lat, lon);
            
            return {
              isValid: false,
              expectedArea: this.boundaries[key].name,
              actualArea: actualBoundary?.name || 'Unknown',
              suggestedCorrection: actualBoundary ? 
                description.replace(new RegExp(name, 'gi'), actualBoundary.name) : 
                null,
              confidence: actualBoundary ? 0.9 : 0.3
            };
          }
        }
      }
    }

    // No specific area mentioned - just return the containing boundary
    const boundary = this.findContainingBoundary(lat, lon);
    return {
      isValid: true,
      area: boundary?.name || 'Unknown',
      confidence: boundary ? 0.8 : 0.2
    };
  }

  // Get nearest known location to coordinates
  getNearestLocation(lat, lon) {
    let nearest = null;
    let minDistance = Infinity;

    for (const [key, boundary] of Object.entries(this.boundaries)) {
      if (boundary.center) {
        const dist = this.calculateDistance(
          lat, lon,
          boundary.center[0], boundary.center[1]
        );
        
        if (dist < minDistance) {
          minDistance = dist;
          nearest = {
            key,
            name: boundary.name,
            distance: dist,
            center: boundary.center
          };
        }
      }
    }

    return nearest;
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  // Add a new boundary or update existing one
  addOrUpdateBoundary(key, boundary) {
    this.boundaries[key] = boundary;
    console.log(`✅ Boundary ${key} added/updated`);
  }

  // Get all boundaries
  getAllBoundaries() {
    return this.boundaries;
  }

  // Export boundaries for visualization
  exportForMap() {
    const features = [];
    
    for (const [key, boundary] of Object.entries(this.boundaries)) {
      if (boundary.type === 'polygon') {
        features.push({
          type: 'Feature',
          properties: {
            id: key,
            name: boundary.name
          },
          geometry: {
            type: 'Polygon',
            coordinates: [boundary.bounds.map(coord => [coord[1], coord[0]])] // GeoJSON uses [lon, lat]
          }
        });
      } else if (boundary.type === 'corridor') {
        features.push({
          type: 'Feature',
          properties: {
            id: key,
            name: boundary.name,
            buffer: boundary.buffer
          },
          geometry: {
            type: 'LineString',
            coordinates: boundary.points.map(coord => [coord[1], coord[0]])
          }
        });
      }
    }

    return {
      type: 'FeatureCollection',
      features
    };
  }
}

// Create singleton instance
const locationBoundariesService = new LocationBoundariesService();

export default locationBoundariesService;
