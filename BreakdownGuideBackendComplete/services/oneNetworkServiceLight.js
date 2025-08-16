// backend/services/oneNetworkServiceLight.js
// Lightweight one.network integration without web scraping
import axios from 'axios';

class OneNetworkServiceLight {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.baseUrl = 'https://one.network';
  }

  /**
   * Search for roadwork coordinates using permit reference
   * This lightweight version only provides search URLs, no scraping
   */
  async searchByPermitReference(permitRef) {
    if (!permitRef) return null;

    // Check cache first
    const cached = this.cache.get(permitRef);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    // In the lightweight version, we can't scrape
    // Instead, return null and let other strategies handle it
    return null;
  }

  /**
   * Generate one.network search URL for manual lookup
   */
  getSearchUrl(permitRef) {
    return `${this.baseUrl}/search?query=${encodeURIComponent(permitRef)}`;
  }

  /**
   * Generate helpful search suggestions
   */
  getSearchSuggestions(roadwork) {
    const suggestions = [];

    if (roadwork.sm_permit_reference) {
      suggestions.push({
        type: 'permit_reference',
        query: roadwork.sm_permit_reference,
        url: this.getSearchUrl(roadwork.sm_permit_reference)
      });
    }

    if (roadwork.sm_works_reference) {
      suggestions.push({
        type: 'works_reference',
        query: roadwork.sm_works_reference,
        url: this.getSearchUrl(roadwork.sm_works_reference)
      });
    }

    if (roadwork.sm_promoter_organisation && roadwork.sm_street_name) {
      const combinedQuery = `${roadwork.sm_promoter_organisation} ${roadwork.sm_street_name}`;
      suggestions.push({
        type: 'promoter_and_street',
        query: combinedQuery,
        url: this.getSearchUrl(combinedQuery)
      });
    }

    return suggestions;
  }

  /**
   * Store manually found coordinates in cache
   */
  cacheManualResult(permitRef, coordinates) {
    this.cache.set(permitRef, {
      data: coordinates,
      timestamp: Date.now(),
      source: 'manual_entry'
    });
  }
}

// Use the lightweight version by default
export const oneNetworkService = new OneNetworkServiceLight();
