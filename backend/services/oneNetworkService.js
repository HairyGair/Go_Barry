// backend/services/oneNetworkService.js
// Integration with one.network for roadwork coordinate lookup
import axios from 'axios';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

class OneNetworkService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.baseUrl = 'https://one.network';
  }

  /**
   * Search for roadwork coordinates using permit reference
   */
  async searchByPermitReference(permitRef) {
    if (!permitRef) return null;

    // Check cache first
    const cached = this.cache.get(permitRef);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // Method 1: Try direct API if available
      const apiResult = await this.searchViaAPI(permitRef);
      if (apiResult) {
        this.cache.set(permitRef, { data: apiResult, timestamp: Date.now() });
        return apiResult;
      }

      // Method 2: Web scraping as fallback
      const scrapedResult = await this.searchViaScraping(permitRef);
      if (scrapedResult) {
        this.cache.set(permitRef, { data: scrapedResult, timestamp: Date.now() });
        return scrapedResult;
      }
    } catch (error) {
      console.error(`❌ one.network search failed for ${permitRef}:`, error.message);
    }

    return null;
  }

  /**
   * Search via API (if one.network provides one)
   */
  async searchViaAPI(permitRef) {
    // Note: one.network doesn't have a public API, but this is where it would go
    // For now, return null to fall back to scraping
    return null;
  }

  /**
   * Search via web scraping
   */
  async searchViaScraping(permitRef) {
    let browser = null;
    
    try {
      // Use puppeteer with chromium for serverless environments
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

      const page = await browser.newPage();
      
      // Navigate to search page
      await page.goto(`${this.baseUrl}/search?query=${encodeURIComponent(permitRef)}`, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });

      // Wait for results to load
      await page.waitForSelector('.search-results', { timeout: 5000 });

      // Extract coordinates from the first result
      const result = await page.evaluate(() => {
        const firstResult = document.querySelector('.search-result-item');
        if (!firstResult) return null;

        // Look for map data or coordinate information
        const mapData = firstResult.querySelector('[data-lat]');
        if (mapData) {
          return {
            lat: parseFloat(mapData.getAttribute('data-lat')),
            lng: parseFloat(mapData.getAttribute('data-lng'))
          };
        }

        // Alternative: check for inline coordinates in text
        const text = firstResult.innerText;
        const coordMatch = text.match(/(\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (coordMatch) {
          return {
            lat: parseFloat(coordMatch[1]),
            lng: parseFloat(coordMatch[2])
          };
        }

        return null;
      });

      return result;
    } catch (error) {
      console.error('Scraping error:', error);
      return null;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Extract location hints from one.network data
   */
  async getLocationHints(permitRef) {
    // This would scrape additional location information
    // like junction names, nearby landmarks, etc.
    return {
      nearbyJunctions: [],
      landmarks: [],
      additionalDescription: ''
    };
  }
}

export const oneNetworkService = new OneNetworkService();
