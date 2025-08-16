// backend/services/locationValidation.js
// Robust location validation for North East England

// North East England area bounds (approximate)
const NORTH_EAST_BOUNDS = {
  north: 55.9,  // Extended north to include all Northumberland
  south: 54.3,  // Extended south to include Teesside
  east: -0.7,   // Extended east to coast
  west: -3.0    // Extended west to include western Durham
};

// North East postcode areas
const NORTH_EAST_POSTCODES = [
  'NE', 'DH', 'SR', 'DL', 'TS', 'CA9', 'TD15', 'TD12'
];

// North East authorities (normalized uppercase)
const NORTH_EAST_AUTHORITIES = [
  'NEWCASTLE', 'NEWCASTLE CITY', 'NEWCASTLE UPON TYNE',
  'GATESHEAD', 'GATESHEAD COUNCIL',
  'SUNDERLAND', 'SUNDERLAND CITY',
  'NORTH TYNESIDE', 'SOUTH TYNESIDE',
  'DURHAM', 'COUNTY DURHAM', 'DURHAM COUNTY', 'DURHAM COUNTY COUNCIL',
  'NORTHUMBERLAND', 'NORTHUMBERLAND COUNTY', 'NORTHUMBERLAND COUNTY COUNCIL',
  'DARLINGTON', 'HARTLEPOOL', 'MIDDLESBROUGH', 'STOCKTON', 'STOCKTON-ON-TEES',
  'REDCAR', 'REDCAR AND CLEVELAND'
];

// Exclude authorities (definitely not North East)
const EXCLUDE_AUTHORITIES = [
  'WESTMINSTER', 'CAMDEN', 'ISLINGTON', 'HACKNEY', 'TOWER HAMLETS',
  'GREENWICH', 'LEWISHAM', 'SOUTHWARK', 'LAMBETH', 'WANDSWORTH',
  'HAMMERSMITH', 'KENSINGTON', 'CHELSEA', 'CITY OF LONDON',
  'BARNET', 'BRENT', 'EALING', 'ENFIELD', 'HARINGEY', 'HARROW',
  'MANCHESTER', 'LIVERPOOL', 'BIRMINGHAM', 'LEEDS', 'SHEFFIELD',
  'BRISTOL', 'CARDIFF', 'EDINBURGH', 'GLASGOW', 'BELFAST',
  'TRANSPORT FOR LONDON', 'TFL', 'HIGHWAYS ENGLAND SOUTH',
  'DEVON', 'CORNWALL', 'KENT', 'ESSEX', 'SUFFOLK', 'NORFOLK'
];

// North East locations (comprehensive list)
const NORTH_EAST_LOCATIONS = [
  // Major cities
  'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 'DARLINGTON',
  'MIDDLESBROUGH', 'HARTLEPOOL', 'STOCKTON',
  
  // Tyne and Wear
  'SOUTH SHIELDS', 'NORTH SHIELDS', 'WALLSEND', 'JARROW', 'WASHINGTON',
  'WHITLEY BAY', 'TYNEMOUTH', 'HEBBURN', 'FELLING', 'WHICKHAM',
  'BLAYDON', 'RYTON', 'BIRTLEY', 'CHESTER-LE-STREET',
  
  // County Durham
  'BISHOP AUCKLAND', 'CONSETT', 'PETERLEE', 'SEAHAM', 'SPENNYMOOR',
  'NEWTON AYCLIFFE', 'SHILDON', 'BARNARD CASTLE', 'SEDGEFIELD',
  'FERRYHILL', 'CROOK', 'STANLEY', 'BRANDON', 'BOWBURN',
  
  // Northumberland
  'MORPETH', 'ASHINGTON', 'BLYTH', 'HEXHAM', 'ALNWICK', 'BERWICK',
  'PRUDHOE', 'CRAMLINGTON', 'BEDLINGTON', 'AMBLE', 'PONTELAND',
  'WYLAM', 'CORBRIDGE', 'HALTWHISTLE', 'ROTHBURY', 'WOOLER',
  
  // Major roads
  'A1', 'A19', 'A69', 'A167', 'A1058', 'A184', 'A189', 'A191',
  'A692', 'A693', 'A694', 'A695', 'A696', 'A697'
];

// Exclude locations (definitely not North East)
const EXCLUDE_LOCATIONS = [
  'LONDON', 'MANCHESTER', 'BIRMINGHAM', 'LIVERPOOL', 'LEEDS',
  'SHEFFIELD', 'BRISTOL', 'CARDIFF', 'EDINBURGH', 'GLASGOW',
  'WESTMINSTER', 'CHELSEA', 'KENSINGTON', 'CAMDEN', 'ISLINGTON',
  'OXFORD', 'CAMBRIDGE', 'BRIGHTON', 'SOUTHAMPTON', 'PORTSMOUTH',
  'EXETER', 'PLYMOUTH', 'NORWICH', 'IPSWICH', 'CANTERBURY'
];

/**
 * Check if coordinates are within North East England bounds
 */
export function isInNorthEastBounds(lat, lng) {
  if (!lat || !lng) return false;
  
  return lat >= NORTH_EAST_BOUNDS.south && 
         lat <= NORTH_EAST_BOUNDS.north && 
         lng >= NORTH_EAST_BOUNDS.west && 
         lng <= NORTH_EAST_BOUNDS.east;
}

/**
 * Check if a location string contains excluded locations
 */
function containsExcludedLocation(locationString) {
  if (!locationString) return false;
  
  const upperLocation = locationString.toUpperCase();
  
  // Check for excluded locations
  for (const excluded of EXCLUDE_LOCATIONS) {
    if (upperLocation.includes(excluded)) {
      return true;
    }
  }
  
  // Check for excluded authorities
  for (const excluded of EXCLUDE_AUTHORITIES) {
    if (upperLocation.includes(excluded)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Comprehensive North East location validation
 */
export function isNorthEastLocation(locationData) {
  // Handle various input formats
  let location, town, authority, areaName, streetName, coordinates;
  
  if (typeof locationData === 'string') {
    location = locationData;
  } else if (typeof locationData === 'object') {
    location = locationData.location || locationData.street_name || '';
    town = locationData.town || locationData.area_name || '';
    authority = locationData.authority || locationData.highway_authority || '';
    areaName = locationData.areaName || locationData.area_name || '';
    streetName = locationData.streetName || locationData.street_name || '';
    coordinates = locationData.coordinates;
  }
  
  // CRITICAL: First check for excluded locations
  const allLocationText = `${location} ${town} ${authority} ${areaName} ${streetName}`.toUpperCase();
  
  if (containsExcludedLocation(allLocationText)) {
    console.log(`❌ Location excluded: ${allLocationText.substring(0, 50)}...`);
    return false;
  }
  
  // Check coordinates if available
  if (coordinates) {
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      const [lat, lng] = coordinates;
      if (isInNorthEastBounds(lat, lng)) {
        return true;
      }
    } else if (coordinates.lat && coordinates.lng) {
      if (isInNorthEastBounds(coordinates.lat, coordinates.lng)) {
        return true;
      }
    }
  }
  
  // Check authority
  if (authority) {
    const upperAuthority = authority.toUpperCase();
    
    // Explicit exclude check
    for (const excluded of EXCLUDE_AUTHORITIES) {
      if (upperAuthority.includes(excluded)) {
        return false;
      }
    }
    
    // Positive match check
    for (const neAuth of NORTH_EAST_AUTHORITIES) {
      if (upperAuthority.includes(neAuth)) {
        return true;
      }
    }
  }
  
  // Check for North East place names
  for (const neLocation of NORTH_EAST_LOCATIONS) {
    if (allLocationText.includes(neLocation)) {
      return true;
    }
  }
  
  // Check for North East postcodes
  const postcodeRegex = /\b([A-Z]{1,2}\d{1,2})\s*\d?[A-Z]{0,2}\b/g;
  const matches = allLocationText.match(postcodeRegex);
  if (matches) {
    for (const match of matches) {
      const prefix = match.match(/^[A-Z]{1,2}\d{0,2}/)?.[0];
      if (prefix) {
        for (const nePostcode of NORTH_EAST_POSTCODES) {
          if (prefix.startsWith(nePostcode)) {
            return true;
          }
        }
      }
    }
  }
  
  // If no positive match found, it's not North East
  return false;
}

/**
 * Enhanced validation with logging
 */
export function validateNorthEastLocation(locationData) {
  const result = isNorthEastLocation(locationData);
  
  const debugInfo = {
    input: locationData,
    result: result,
    checks: {
      hasCoordinates: !!locationData.coordinates,
      authority: locationData.authority || 'none',
      location: locationData.location || 'none',
      excluded: containsExcludedLocation(JSON.stringify(locationData))
    }
  };
  
  if (!result) {
    console.log('🚫 Location validation failed:', debugInfo);
  }
  
  return result;
}

/**
 * Get validation statistics
 */
export function getValidationStats() {
  return {
    northEastBounds: NORTH_EAST_BOUNDS,
    postcodes: NORTH_EAST_POSTCODES.length,
    authorities: NORTH_EAST_AUTHORITIES.length,
    locations: NORTH_EAST_LOCATIONS.length,
    excludedAuthorities: EXCLUDE_AUTHORITIES.length,
    excludedLocations: EXCLUDE_LOCATIONS.length
  };
}
