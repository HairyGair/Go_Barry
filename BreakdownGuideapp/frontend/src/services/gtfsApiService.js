/**
 * GTFS API Service
 * Handles all calls to the GTFS Phase 1 + Phase 2 API endpoints
 * Phase 1: Route status, coverage analysis, heatmap
 * Phase 2: Trips at risk, service gaps, shape matching, timetable, stop finder
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

  // ─── Phase 2 Features ──────────────────────────────────────

  async getTripsAtRisk({ route_id, lat, lng, minutes = 120 }) {
    try {
      const params = new URLSearchParams({ route_id });
      if (lat) params.set('lat', lat);
      if (lng) params.set('lng', lng);
      if (minutes) params.set('minutes', minutes);
      return await apiClient.get(`${GTFS_API_BASE}/trips-at-risk?${params}`);
    } catch (error) {
      console.error('Error fetching trips at risk:', error);
      throw error;
    }
  },

  async getServiceGaps({ route_id, breakdown_time, direction_id, stop_id }) {
    try {
      const params = new URLSearchParams({ route_id });
      if (breakdown_time) params.set('breakdown_time', breakdown_time);
      if (direction_id !== undefined) params.set('direction_id', direction_id);
      if (stop_id) params.set('stop_id', stop_id);
      return await apiClient.get(`${GTFS_API_BASE}/service-gaps?${params}`);
    } catch (error) {
      console.error('Error fetching service gaps:', error);
      throw error;
    }
  },

  async getShapeRouteMatch({ lat, lng, radius_m = 100 }) {
    try {
      const params = new URLSearchParams({ lat, lng, radius_m });
      return await apiClient.get(`${GTFS_API_BASE}/shape-route-match?${params}`);
    } catch (error) {
      console.error('Error fetching shape route match:', error);
      throw error;
    }
  },

  async getRouteTimetable(routeId, { direction_id, service_id, from_time, to_time } = {}) {
    try {
      const params = new URLSearchParams();
      if (direction_id !== undefined) params.set('direction_id', direction_id);
      if (service_id) params.set('service_id', service_id);
      if (from_time) params.set('from_time', from_time);
      if (to_time) params.set('to_time', to_time);
      const qs = params.toString();
      return await apiClient.get(`${GTFS_API_BASE}/timetable/${routeId}${qs ? '?' + qs : ''}`);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      throw error;
    }
  },

  async getRoutesList() {
    try {
      return await apiClient.get(`${GTFS_API_BASE}/routes/list`);
    } catch (error) {
      console.error('Error fetching routes list:', error);
      throw error;
    }
  },

  async searchStops({ q, lat, lng, radius_km = 1, limit = 50 }) {
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (lat) params.set('lat', lat);
      if (lng) params.set('lng', lng);
      if (radius_km) params.set('radius_km', radius_km);
      if (limit) params.set('limit', limit);
      return await apiClient.get(`${GTFS_API_BASE}/stops/search?${params}`);
    } catch (error) {
      console.error('Error searching stops:', error);
      throw error;
    }
  },

  async getStopDepartures(stopId, { from_time, limit = 20 } = {}) {
    try {
      const params = new URLSearchParams();
      if (from_time) params.set('from_time', from_time);
      if (limit) params.set('limit', limit);
      const qs = params.toString();
      return await apiClient.get(`${GTFS_API_BASE}/stops/${stopId}/departures${qs ? '?' + qs : ''}`);
    } catch (error) {
      console.error('Error fetching stop departures:', error);
      throw error;
    }
  },
};
