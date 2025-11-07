// Secure API Client with automatic auth token inclusion and comprehensive security
// Ensures all API calls include proper authentication tokens and handles token validation
// Supabase removed - now uses backend MySQL API

class SecureApiClient {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL || 'https://breakdowns.gobarry.co.uk/api';
        this.defaultTimeout = 10000; // 10 seconds
        this.maxRetries = 3;
    }

    // Get current auth token from backend session
    // NOTE: This method is deprecated - authentication now uses HTTP-only cookies
    async getAuthToken() {
        // Authentication is now via HTTP-only cookies (XSS protection)
        // This method is kept for backward compatibility but does nothing
        console.log('🔐 Authentication via HTTP-only cookies (automatic)');
        return null; // No token needed - cookie sent automatically
    }

    // Create authenticated headers for API requests
    // NOTE: No Authorization header needed - HTTP-only cookies handle auth
    async createAuthHeaders(additionalHeaders = {}) {
        return {
            'Content-Type': 'application/json',
            'X-Client-Info': 'gne-breakdown-guide@1.0.0',
            'X-Timestamp': new Date().toISOString(),
            ...additionalHeaders
            // NOTE: No Authorization header - using HTTP-only cookies
        };
    }

    // Enhanced fetch with automatic auth token inclusion
    async secureRequest(endpoint, options = {}) {
        const {
            method = 'GET',
            body,
            headers = {},
            timeout = this.defaultTimeout,
            retries = this.maxRetries,
            requireAuth = true,
            ...fetchOptions
        } = options;

        // Ensure endpoint starts with /
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${this.baseURL}${normalizedEndpoint}`;

        try {
            // Create authenticated headers if required
            const requestHeaders = requireAuth
                ? await this.createAuthHeaders(headers)
                : { 'Content-Type': 'application/json', ...headers };

            // Prepare request options
            const requestOptions = {
                method,
                headers: requestHeaders,
                credentials: 'include', // IMPORTANT: Send HTTP-only cookies with request
                ...fetchOptions
            };

            // Add body for non-GET requests
            if (body && method !== 'GET') {
                requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
            }

            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
                // Make the request
                const response = await fetch(url, {
                    ...requestOptions,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // Handle response
                return await this.handleResponse(response, endpoint, retries);

            } catch (fetchError) {
                clearTimeout(timeoutId);

                if (fetchError.name === 'AbortError') {
                    throw new Error(`Request timeout after ${timeout}ms`);
                }
                throw fetchError;
            }

        } catch (error) {
            console.error(`Secure API request failed [${method} ${endpoint}]:`, error);

            // Retry logic for certain errors
            if (retries > 0 && this.shouldRetry(error)) {
                console.log(`Retrying request to ${endpoint} (${retries} attempts remaining)`);
                await this.delay(1000 * (this.maxRetries - retries + 1)); // Exponential backoff

                return this.secureRequest(endpoint, {
                    ...options,
                    retries: retries - 1
                });
            }

            throw this.createUserFriendlyError(error, endpoint);
        }
    }

    // Handle API response
    async handleResponse(response, endpoint, retriesRemaining) {
        // Handle 401 - Token expired or invalid
        if (response.status === 401) {
            console.warn('Auth token invalid, attempting refresh...');

            try {
                // Supabase removed - now uses backend MySQL API
                // TODO: Implement backend session refresh
                // For now, trigger logout
                throw new Error('Session refresh not implemented');
            } catch (refreshError) {
                console.error('Session refresh failed:', refreshError);
                // Trigger logout/redirect to login
                window.dispatchEvent(new CustomEvent('auth:session-expired'));
            }

            throw new Error('Authentication required. Please log in again.');
        }

        // Handle 403 - Insufficient permissions
        if (response.status === 403) {
            throw new Error('You do not have permission to perform this action.');
        }

        // Handle 429 - Rate limiting
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || '60';
            throw new Error(`Too many requests. Please wait ${retryAfter} seconds and try again.`);
        }

        // Handle 5xx server errors
        if (response.status >= 500) {
            throw new Error('Server error. Please try again later.');
        }

        // Handle other 4xx client errors
        if (response.status >= 400) {
            const errorText = await response.text();
            let errorMessage;

            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || 'Request failed';
            } catch {
                errorMessage = errorText || 'Request failed';
            }

            throw new Error(errorMessage);
        }

        // Parse successful response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }

        return await response.text();
    }

    // Determine if error is retryable
    shouldRetry(error) {
        // Retry network errors, timeouts, and 5xx errors
        return (
            error.message.includes('timeout') ||
            error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.status >= 500
        );
    }

    // Create user-friendly error message
    createUserFriendlyError(error, endpoint) {
        if (error.message.includes('Authentication required')) {
            return new Error('Please log in to continue.');
        }

        if (error.message.includes('network') || error.message.includes('fetch')) {
            return new Error('Connection problem. Please check your internet connection.');
        }

        if (error.message.includes('timeout')) {
            return new Error('Request timed out. Please try again.');
        }

        return new Error(error.message || 'An unexpected error occurred.');
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Convenience methods for common HTTP verbs
    async get(endpoint, options = {}) {
        return this.secureRequest(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, body, options = {}) {
        return this.secureRequest(endpoint, { ...options, method: 'POST', body });
    }

    async put(endpoint, body, options = {}) {
        return this.secureRequest(endpoint, { ...options, method: 'PUT', body });
    }

    async patch(endpoint, body, options = {}) {
        return this.secureRequest(endpoint, { ...options, method: 'PATCH', body });
    }

    async delete(endpoint, options = {}) {
        return this.secureRequest(endpoint, { ...options, method: 'DELETE' });
    }

    // Public endpoints that don't require authentication
    async publicGet(endpoint, options = {}) {
        return this.secureRequest(endpoint, { ...options, method: 'GET', requireAuth: false });
    }

    async publicPost(endpoint, body, options = {}) {
        return this.secureRequest(endpoint, { ...options, method: 'POST', body, requireAuth: false });
    }
}

// Create and export singleton instance
export const secureApiClient = new SecureApiClient();

// Export class for testing
export { SecureApiClient };

// Convenience exports for common operations
export const apiGet = (endpoint, options) => secureApiClient.get(endpoint, options);
export const apiPost = (endpoint, body, options) => secureApiClient.post(endpoint, body, options);
export const apiPut = (endpoint, body, options) => secureApiClient.put(endpoint, body, options);
export const apiPatch = (endpoint, body, options) => secureApiClient.patch(endpoint, body, options);
export const apiDelete = (endpoint, options) => secureApiClient.delete(endpoint, options);

// Public API calls (no auth required)
export const publicApiGet = (endpoint, options) => secureApiClient.publicGet(endpoint, options);
export const publicApiPost = (endpoint, body, options) => secureApiClient.publicPost(endpoint, body, options);