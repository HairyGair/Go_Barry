// backend/services/what3wordsService.js
// What3Words integration for easy location sharing
import axios from 'axios';

const W3W_API_KEY = process.env.WHAT3WORDS_API_KEY;
const W3W_BASE_URL = 'https://api.what3words.com/v3';

/**
 * Convert coordinates to What3Words address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} What3Words result
 */
export async function convertToWhat3Words(lat, lng) {
  if (!W3W_API_KEY) {
    console.warn('⚠️ What3Words API key not configured');
    return {
      success: false,
      error: 'What3Words API key not configured'
    };
  }

  try {
    const response = await axios.get(`${W3W_BASE_URL}/convert-to-3wa`, {
      params: {
        coordinates: `${lat},${lng}`,
        key: W3W_API_KEY,
        format: 'json'
      },
      timeout: 5000
    });

    if (response.data.words) {
      return {
        success: true,
        words: response.data.words,
        nearestPlace: response.data.nearestPlace,
        map: response.data.map,
        language: response.data.language || 'en'
      };
    }

    return {
      success: false,
      error: 'No words returned from API'
    };
  } catch (error) {
    console.error('❌ What3Words conversion error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Convert What3Words address to coordinates
 * @param {string} words - Three word address (e.g., "filled.count.soap")
 * @returns {Object} Coordinate result
 */
export async function convertFromWhat3Words(words) {
  if (!W3W_API_KEY) {
    return {
      success: false,
      error: 'What3Words API key not configured'
    };
  }

  // Validate format (three words separated by dots)
  const wordPattern = /^[\w]+\.[\w]+\.[\w]+$/;
  if (!wordPattern.test(words)) {
    return {
      success: false,
      error: 'Invalid What3Words format. Expected: word.word.word'
    };
  }

  try {
    const response = await axios.get(`${W3W_BASE_URL}/convert-to-coordinates`, {
      params: {
        words: words,
        key: W3W_API_KEY,
        format: 'json'
      },
      timeout: 5000
    });

    if (response.data.coordinates) {
      return {
        success: true,
        coordinates: {
          lat: response.data.coordinates.lat,
          lng: response.data.coordinates.lng
        },
        nearestPlace: response.data.nearestPlace,
        country: response.data.country,
        language: response.data.language
      };
    }

    return {
      success: false,
      error: 'No coordinates returned from API'
    };
  } catch (error) {
    console.error('❌ What3Words reverse conversion error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get What3Words grid section for a bounding box
 * Useful for showing W3W squares on a map
 * @param {Object} bounds - {sw: {lat, lng}, ne: {lat, lng}}
 * @returns {Object} Grid section data
 */
export async function getWhat3WordsGrid(bounds) {
  if (!W3W_API_KEY) {
    return {
      success: false,
      error: 'What3Words API key not configured'
    };
  }

  try {
    const response = await axios.get(`${W3W_BASE_URL}/grid-section`, {
      params: {
        'bounding-box': `${bounds.sw.lat},${bounds.sw.lng},${bounds.ne.lat},${bounds.ne.lng}`,
        key: W3W_API_KEY,
        format: 'json'
      },
      timeout: 5000
    });

    return {
      success: true,
      lines: response.data.lines || []
    };
  } catch (error) {
    console.error('❌ What3Words grid error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process roadwork with What3Words enrichment
 * @param {Object} roadwork - Roadwork with coordinates
 * @returns {Object} Roadwork with W3W data
 */
export async function enrichRoadworkWithWhat3Words(roadwork) {
  if (!roadwork.coordinates || !Array.isArray(roadwork.coordinates)) {
    return roadwork;
  }

  const [lat, lng] = roadwork.coordinates;
  const w3wResult = await convertToWhat3Words(lat, lng);

  if (w3wResult.success) {
    return {
      ...roadwork,
      what3words: {
        words: w3wResult.words,
        nearestPlace: w3wResult.nearestPlace,
        shareUrl: `https://w3w.co/${w3wResult.words}`
      }
    };
  }

  return roadwork;
}

// Batch process multiple roadworks (with rate limiting)
export async function batchEnrichWithWhat3Words(roadworks, limit = 10) {
  const enriched = [];
  const toProcess = roadworks.slice(0, limit); // Limit to avoid rate limits

  for (const roadwork of toProcess) {
    const enrichedRoadwork = await enrichRoadworkWithWhat3Words(roadwork);
    enriched.push(enrichedRoadwork);
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Return all roadworks, with only some enriched
  return [
    ...enriched,
    ...roadworks.slice(limit)
  ];
}

export default {
  convertToWhat3Words,
  convertFromWhat3Words,
  getWhat3WordsGrid,
  enrichRoadworkWithWhat3Words,
  batchEnrichWithWhat3Words
};
