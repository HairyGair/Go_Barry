/**
 * useApi Hook
 * Provides API call functionality with automatic token refresh
 * Handles authentication, retries, and error handling
 */

import { useCallback, useRef } from 'react';
import { useSupervisor } from './useSupervisorSessionOptimized';
import { willExpireSoon, isTokenExpired } from '../../utils/tokenManager';

// API configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://go-barry.onrender.com';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10);

/**
 * Custom hook for making authenticated API calls
 * Features:
 * - Automatic token refresh before expiry
 * - Retry on 401 with new token
 * - Request timeout handling
 * - Concurrent refresh prevention
 * - Comprehensive error handling
 */
export const useApi = () => {
  const {
    accessToken,
    refreshAccessToken,
    logout,
    isLoggedIn
  } = useSupervisor();

  // Track ongoing refresh to prevent concurrent refreshes
  const refreshPromiseRef = useRef(null);

  /**
   * Ensure we have a valid access token
   * Refreshes token if expiring soon or expired
   */
  const ensureValidToken = useCallback(async () => {
    // No access token, can't refresh
    if (!accessToken) {
      return null;
    }

    // Token is valid and not expiring soon
    if (!isTokenExpired(accessToken) && !willExpireSoon(accessToken, 5)) {
      return accessToken;
    }

    console.log('🔄 Access token expiring soon, refreshing...');

    // If refresh is already in progress, wait for it
    if (refreshPromiseRef.current) {
      console.log('⏳ Token refresh already in progress, waiting...');
      try {
        await refreshPromiseRef.current;
        return accessToken; // Return updated token from state
      } catch (error) {
        console.error('❌ Concurrent refresh failed:', error.message);
        return null;
      }
    }

    // Start new refresh
    try {
      refreshPromiseRef.current = refreshAccessToken();
      const result = await refreshPromiseRef.current;

      if (result.success) {
        console.log('✅ Token refreshed successfully');
        return result.token;
      } else {
        console.warn('⚠️ Token refresh failed:', result.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error.message);
      return null;
    } finally {
      refreshPromiseRef.current = null;
    }
  }, [accessToken, refreshAccessToken]);

  /**
   * Make an authenticated API call
   * @param {string} url - Full URL or path (if path, will prepend API_BASE_URL)
   * @param {object} options - Fetch options
   * @param {boolean} skipAuth - Skip authentication header (for public endpoints)
   * @returns {Promise<Response>} Fetch response
   */
  const apiCall = useCallback(async (url, options = {}, skipAuth = false) => {
    try {
      // Build full URL if path provided
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

      // Ensure valid token if authentication required
      let currentToken = accessToken;
      if (!skipAuth && isLoggedIn) {
        currentToken = await ensureValidToken();

        if (!currentToken) {
          throw new Error('Unable to refresh access token');
        }
      }

      // Build headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add authorization header if authenticated
      if (!skipAuth && currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        // Make API request
        const response = await fetch(fullUrl, {
          ...options,
          headers,
          credentials: 'include', // Include cookies for refresh token
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle 401 Unauthorized - try refresh once
        if (response.status === 401 && !skipAuth && isLoggedIn) {
          console.warn('⚠️ 401 Unauthorized, attempting token refresh...');

          const newToken = await ensureValidToken();

          if (!newToken) {
            console.error('❌ Token refresh failed, logging out');
            await logout();
            throw new Error('Session expired - please log in again');
          }

          // Retry request with new token
          console.log('🔄 Retrying request with refreshed token...');
          headers['Authorization'] = `Bearer ${newToken}`;

          const retryResponse = await fetch(fullUrl, {
            ...options,
            headers,
            credentials: 'include',
          });

          return retryResponse;
        }

        // Handle 403 Forbidden - logout immediately
        if (response.status === 403 && !skipAuth) {
          console.error('❌ 403 Forbidden - logging out');
          await logout();
          throw new Error('Access forbidden');
        }

        return response;

      } catch (fetchError) {
        clearTimeout(timeoutId);

        // Handle abort/timeout
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }

        throw fetchError;
      }

    } catch (error) {
      console.error('❌ API call error:', error.message);
      throw error;
    }
  }, [accessToken, ensureValidToken, isLoggedIn, logout]);

  /**
   * Make a GET request
   * @param {string} url - API endpoint
   * @param {object} options - Additional fetch options
   * @returns {Promise<object>} JSON response
   */
  const get = useCallback(async (url, options = {}) => {
    const response = await apiCall(url, { ...options, method: 'GET' });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }, [apiCall]);

  /**
   * Make a POST request
   * @param {string} url - API endpoint
   * @param {object} data - Request body
   * @param {object} options - Additional fetch options
   * @returns {Promise<object>} JSON response
   */
  const post = useCallback(async (url, data, options = {}) => {
    const response = await apiCall(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }, [apiCall]);

  /**
   * Make a PUT request
   * @param {string} url - API endpoint
   * @param {object} data - Request body
   * @param {object} options - Additional fetch options
   * @returns {Promise<object>} JSON response
   */
  const put = useCallback(async (url, data, options = {}) => {
    const response = await apiCall(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }, [apiCall]);

  /**
   * Make a DELETE request
   * @param {string} url - API endpoint
   * @param {object} options - Additional fetch options
   * @returns {Promise<object>} JSON response
   */
  const del = useCallback(async (url, options = {}) => {
    const response = await apiCall(url, { ...options, method: 'DELETE' });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }, [apiCall]);

  return {
    apiCall,
    get,
    post,
    put,
    delete: del,
    ensureValidToken,
  };
};

export default useApi;
