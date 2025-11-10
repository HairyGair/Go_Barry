/**
 * Preferences API Service
 * Handles all API calls for user preferences
 */

import apiClient from './api-client.js';

const preferencesAPI = {
  /**
   * Get current user's preferences
   * @returns {Promise<Object>} User preferences object
   */
  async getPreferences() {
    try {
      const response = await apiClient.get('/api/preferences');
      return response.data.preferences;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }
  },

  /**
   * Update user preferences
   * @param {Object} preferences - Preferences object to update
   * @returns {Promise<Object>} Updated preferences
   */
  async updatePreferences(preferences) {
    try {
      const response = await apiClient.put('/api/preferences', preferences);
      return response.data.preferences;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  },

  /**
   * Update a single preference field
   * @param {string} key - Preference key
   * @param {any} value - Preference value
   * @returns {Promise<Object>} Updated preferences
   */
  async updatePreference(key, value) {
    try {
      const response = await apiClient.patch('/api/preferences', { key, value });
      return response.data.preferences;
    } catch (error) {
      console.error('Error updating preference:', error);
      throw error;
    }
  },

  /**
   * Reset preferences to defaults
   * @returns {Promise<Object>} Default preferences
   */
  async resetPreferences() {
    try {
      const response = await apiClient.delete('/api/preferences');
      return response.data.preferences;
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw error;
    }
  },

  /**
   * Export preferences as JSON
   * @returns {Promise<Object>} Export data
   */
  async exportPreferences() {
    try {
      const response = await apiClient.post('/api/preferences/export');
      return response.data.data;
    } catch (error) {
      console.error('Error exporting preferences:', error);
      throw error;
    }
  },

  /**
   * Import preferences from backup
   * @param {Object} preferences - Preferences to import
   * @returns {Promise<Object>} Imported preferences
   */
  async importPreferences(preferences) {
    try {
      const response = await apiClient.post('/api/preferences/import', { preferences });
      return response.data.preferences;
    } catch (error) {
      console.error('Error importing preferences:', error);
      throw error;
    }
  }
};

export default preferencesAPI;
