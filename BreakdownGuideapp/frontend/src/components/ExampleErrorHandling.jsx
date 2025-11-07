/**
 * Example Component - Demonstrates proper error handling patterns
 * 
 * This component shows how to:
 * 1. Handle API errors with ErrorAlert
 * 2. Use loading states
 * 3. Implement retry logic
 * 4. Provide user feedback
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api-client';
import ErrorAlert from './ErrorAlert';

export default function ExampleErrorHandling() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data function with proper error handling
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // API client will automatically retry on network/server errors
      const result = await apiClient.get('/api/breakdowns');
      setData(result);
    } catch (err) {
      // Set error to display ErrorAlert
      setError(err);
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="example-container">
      <h2>Example: Proper Error Handling</h2>

      {/* ErrorAlert shows inline errors with retry option */}
      <ErrorAlert 
        error={error}
        onRetry={fetchData}
        onDismiss={() => setError(null)}
      />

      {/* Loading state */}
      {loading && (
        <div className="loading">
          Loading data...
        </div>
      )}

      {/* Success state */}
      {data && !loading && (
        <div className="data-display">
          <h3>Data loaded successfully</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div className="empty-state">
          No data available
        </div>
      )}

      {/* Manual retry button */}
      <button 
        onClick={fetchData} 
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Loading...' : 'Refresh Data'}
      </button>
    </div>
  );
}

/**
 * Advanced Example: Custom retry configuration
 */
export function ExampleCustomRetry() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchWithCustomRetry = async () => {
    try {
      // Increase retries for critical data
      const result = await apiClient.get('/api/critical-data', {
        retries: 5,           // More retries
        retryDelay: 2000      // Longer delay between retries
      });
      setData(result);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div>
      <ErrorAlert error={error} onRetry={fetchWithCustomRetry} />
      {/* rest of component */}
    </div>
  );
}

/**
 * Advanced Example: Multiple API calls with error handling
 */
export function ExampleMultipleAPICalls() {
  const [breakdowns, setBreakdowns] = useState(null);
  const [fleet, setFleet] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    setErrors({});

    try {
      // Fetch breakdowns
      const breakdownData = await apiClient.get('/api/breakdowns');
      setBreakdowns(breakdownData);
    } catch (err) {
      setErrors(prev => ({ ...prev, breakdowns: err }));
    }

    try {
      // Fetch fleet data
      const fleetData = await apiClient.get('/api/fleet');
      setFleet(fleetData);
    } catch (err) {
      setErrors(prev => ({ ...prev, fleet: err }));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div>
      {/* Show error for each failed API call */}
      <ErrorAlert 
        error={errors.breakdowns}
        onRetry={fetchAllData}
      />
      <ErrorAlert 
        error={errors.fleet}
        onRetry={fetchAllData}
      />

      {loading && <p>Loading...</p>}
      
      {/* Display data */}
      {breakdowns && <div>Breakdowns: {breakdowns.length}</div>}
      {fleet && <div>Fleet vehicles: {fleet.length}</div>}
    </div>
  );
}
