/**
 * GTFS API Service
 * Handles all calls to the GTFS Phase 1 API endpoints
 * Provides real-time route status, coverage analysis, and heatmap data
 */

import { apiClient } from './api-client';

// API base endpoint for GTFS features
const GTFS_API_BASE = '/api/gtfs';

export const gtfsApiService = {
  /**
   * Get health status of GTFS API
   * @returns {Promise<Object>} Health status
   */
  async getHealth() {
    try {
      const response = await apiClient.get(`${GTFS_API_BASE}/health`);
      return response;
    } catch (error) {
      console.error('Error checking GTFS health:', error);
      throw error;
    }
  },

  /**
   * Get live route status for all routes (Green/Amber/Red)
   * @returns {Promise<Object>} Route status summary and detailed route data
   */
  async getLiveRouteStatus() {
    try {
      const response = await apiClient.get(`${GTFS_API_BASE}/routes/status/live`);
      return response;
    } catch (error) {
      console.error('Error fetching live route status:', error);
      throw error;
    }
  },

  /**
   * Get status for a specific route
   * @param {string} routeId - GTFS route ID (e.g., '1', '2', 'X1')
   * @returns {Promise<Object>} Route status details
   */
  async getRouteStatus(routeId) {
    try {
      const response = await apiClient.get(`${GTFS_API_BASE}/routes/${routeId}/status`);
      return response;
    } catch (error) {
      console.error(`Error fetching status for route ${routeId}:`, error);
      throw error;
    }
  },

  /**
   * Get route coverage analysis
   * Shows which routes have insufficient vehicle coverage
   * @returns {Promise<Object>} Coverage analysis data
   */
  async getCoverageAnalysis() {
    try {
      const response = await apiClient.get(`${GTFS_API_BASE}/routes/coverage/analysis`);
      return response;
    } catch (error) {
      console.error('Error fetching coverage analysis:', error);
      throw error;
    }
  },

  /**
   * Get breakdown heatmap data
   * Shows incident clustering and hotspots
   * @returns {Promise<Object>} Heatmap data with coordinates and clustering
   */
  async getBreakdownHeatmap() {
    try {
      const response = await apiClient.get(`${GTFS_API_BASE}/breakdowns/heatmap`);
      return response;
    } catch (error) {
      console.error('Error fetching breakdown heatmap:', error);
      throw error;
    }
  },
};
