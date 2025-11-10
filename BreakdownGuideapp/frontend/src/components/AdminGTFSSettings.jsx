/**
 * Admin GTFS Settings Component
 *
 * Tabbed interface for uploading and managing GTFS data files
 * Supports: routes, stops, trips, stop_times
 *
 * @author Anthony Gair
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AdminGTFSSettings.css';

const AdminGTFSSettings = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('routes');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const fileInputRef = useRef(null);

  // GTFS file type configurations
  const gtfsTypes = {
    routes: {
      label: 'Routes',
      icon: '🚌',
      endpoint: '/api/admin/gtfs/routes',
      description: 'Bus route definitions (route_id, route_short_name, route_long_name)',
      requiredColumns: ['route_id', 'route_short_name'],
      optionalColumns: ['route_long_name', 'route_type', 'route_color', 'route_text_color'],
      example: 'route_id,route_short_name,route_long_name,route_type\n1,X1,Newcastle to Middlesbrough,3'
    },
    stops: {
      label: 'Stops',
      icon: '🛑',
      endpoint: '/api/admin/gtfs/stops',
      description: 'Bus stop locations (stop_id, stop_name, stop_lat, stop_lon)',
      requiredColumns: ['stop_id', 'stop_name', 'stop_lat', 'stop_lon'],
      optionalColumns: ['stop_code', 'stop_desc', 'zone_id', 'stop_url'],
      example: 'stop_id,stop_name,stop_lat,stop_lon\n3200YYA00541,Eldon Square,-1.614456,54.975455'
    },
    trips: {
      label: 'Trips',
      icon: '🗓️',
      endpoint: '/api/admin/gtfs/trips',
      description: 'Trip schedules (trip_id, route_id, service_id, direction_id)',
      requiredColumns: ['trip_id', 'route_id', 'service_id'],
      optionalColumns: ['trip_headsign', 'direction_id', 'block_id', 'shape_id'],
      example: 'trip_id,route_id,service_id,trip_headsign,direction_id\n123456,1,WD,Middlesbrough,0'
    },
    'stop-times': {
      label: 'Stop Times',
      icon: '⏰',
      endpoint: '/api/admin/gtfs/stop-times',
      description: 'Stop timing data (trip_id, stop_id, arrival_time, departure_time)',
      requiredColumns: ['trip_id', 'stop_id', 'arrival_time', 'departure_time', 'stop_sequence'],
      optionalColumns: ['pickup_type', 'drop_off_type', 'timepoint'],
      example: 'trip_id,stop_id,arrival_time,departure_time,stop_sequence\n123456,3200YYA00541,08:00:00,08:00:00,1'
    }
  };

  const currentType = gtfsTypes[activeTab];

  // Load statistics when tab changes
  useEffect(() => {
    loadStatistics(activeTab);
  }, [activeTab]);

  // Load current statistics for GTFS data
  const loadStatistics = async (type) => {
    setLoadingStats(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
      // Use the single stats endpoint that returns all GTFS statistics
      const response = await fetch(`${apiUrl}/api/admin/gtfs/stats`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      } else {
        // Silently fail - stats are optional
        setStatistics(null);
      }
    } catch (err) {
      // Silently fail - stats endpoint may not be available if backend not deployed
      console.debug('Statistics load - endpoint not available yet:', err.message);
      setStatistics(null);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle drag events
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.txt'))) {
      if (droppedFile.size > 100 * 1024 * 1024) { // 100MB limit
        setError('File size exceeds 100MB limit');
        return;
      }
      setFile(droppedFile);
      setResults(null);
      setError(null);
    } else {
      setError('Please drop a CSV or TXT file');
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 100 * 1024 * 1024) { // 100MB limit
        setError('File size exceeds 100MB limit');
        return;
      }
      setFile(selectedFile);
      setResults(null);
      setError(null);
    }
  };

  // Trigger file input click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Upload GTFS file
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    // Check authentication
    if (!isAuthenticated || !currentUser) {
      setError('Authentication required. Please log in.');
      return;
    }

    // Check admin privileges
    if (currentUser.role !== 'admin') {
      setError('Admin privileges required to import GTFS data.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('gtfsFile', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
      const uploadUrl = `${apiUrl}${currentType.endpoint}`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Upload failed');
      }

      setResults(data);
      setFile(null);

      // Reload statistics
      loadStatistics(activeTab);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload GTFS file');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Download template file
  const downloadTemplate = () => {
    const csvContent = `${currentType.requiredColumns.concat(currentType.optionalColumns).join(',')}\n${currentType.example.split('\n')[1]}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gtfs_${activeTab}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Download error report
  const downloadErrorReport = () => {
    if (!results || !results.errors || results.errors.length === 0) {
      return;
    }

    const csvContent = [
      'Row Number,Error Messages',
      ...results.errors.map(err =>
        `${err.rowNumber || 'N/A'},"${err.errors?.join('; ') || err.error || 'Unknown error'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gtfs_${activeTab}_errors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setResults(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-gtfs-settings">
      <div className="gtfs-header">
        <h2>GTFS Data Management</h2>
        <p className="gtfs-description">
          Import and manage General Transit Feed Specification (GTFS) data files for route matching and analysis.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="gtfs-tabs">
        {Object.entries(gtfsTypes).map(([key, type]) => (
          <button
            key={key}
            className={`tab-button ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
            type="button"
          >
            <span className="tab-icon">{type.icon}</span>
            <span className="tab-label">{type.label}</span>
          </button>
        ))}
      </div>

      {/* Current Statistics */}
      {statistics && !loadingStats && (
        <div className="gtfs-statistics">
          <div className="stat-card">
            <div className="stat-label">Total Records</div>
            <div className="stat-value">{statistics.totalRecords?.toLocaleString() || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Last Updated</div>
            <div className="stat-value">{formatDate(statistics.lastUpdated)}</div>
          </div>
          {statistics.fileSize && (
            <div className="stat-card">
              <div className="stat-label">Database Size</div>
              <div className="stat-value">{formatFileSize(statistics.fileSize)}</div>
            </div>
          )}
        </div>
      )}

      {/* File Type Information */}
      <div className="gtfs-info-card">
        <div className="info-header">
          <span className="info-icon">{currentType.icon}</span>
          <h3>{currentType.label} File Requirements</h3>
        </div>
        <p className="info-description">{currentType.description}</p>

        <div className="columns-info">
          <div className="column-section">
            <h4>Required Columns:</h4>
            <ul>
              {currentType.requiredColumns.map(col => (
                <li key={col}>
                  <code>{col}</code>
                </li>
              ))}
            </ul>
          </div>
          <div className="column-section">
            <h4>Optional Columns:</h4>
            <ul>
              {currentType.optionalColumns.map(col => (
                <li key={col}>
                  <code>{col}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="example-section">
          <h4>Example Format:</h4>
          <pre><code>{currentType.example}</code></pre>
        </div>

        <button
          className="btn-download-template"
          onClick={downloadTemplate}
          type="button"
        >
          📥 Download {currentType.label} Template
        </button>
      </div>

      {/* Drag and Drop Upload Area */}
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {!file ? (
          <>
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              Drag and drop your {currentType.label} file here
            </p>
            <p className="upload-subtext">CSV or TXT format (max 100MB)</p>
            <button
              className="btn-browse"
              onClick={handleBrowseClick}
              type="button"
            >
              Browse Files
            </button>
          </>
        ) : (
          <>
            <div className="file-selected">
              <div className="file-icon">📄</div>
              <div className="file-details">
                <p className="file-name">{file.name}</p>
                <p className="file-size">{formatFileSize(file.size)}</p>
              </div>
              <button
                className="btn-remove"
                onClick={handleReset}
                type="button"
              >
                ✕
              </button>
            </div>
          </>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="progress-text">{progress}% Uploading...</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="btn-upload"
          onClick={handleUpload}
          disabled={!file || uploading}
          type="button"
        >
          {uploading ? 'Uploading...' : `🚀 Upload ${currentType.label}`}
        </button>

        {file && !uploading && (
          <button
            className="btn-cancel"
            onClick={handleReset}
            type="button"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Import Results */}
      {results && (
        <div className="import-results">
          <div className={`results-header ${results.success ? 'success' : 'error'}`}>
            <h3>
              {results.success ? '✅ Import Completed' : '❌ Import Failed'}
            </h3>
          </div>

          <div className="results-stats">
            <div className="stat-card">
              <div className="stat-value">{results.totalRows || 0}</div>
              <div className="stat-label">Total Rows</div>
            </div>

            <div className="stat-card success">
              <div className="stat-value">{results.successCount || 0}</div>
              <div className="stat-label">Successfully Imported</div>
            </div>

            {results.updatedCount > 0 && (
              <div className="stat-card warning">
                <div className="stat-value">{results.updatedCount}</div>
                <div className="stat-label">Updated Records</div>
              </div>
            )}

            {results.failureCount > 0 && (
              <div className="stat-card error">
                <div className="stat-value">{results.failureCount}</div>
                <div className="stat-label">Failed</div>
              </div>
            )}
          </div>

          {/* Warnings */}
          {results.warnings && results.warnings.length > 0 && (
            <div className="warnings-section">
              <h4>⚠️ Warnings ({results.warnings.length})</h4>
              <div className="warnings-list">
                {results.warnings.slice(0, 5).map((warning, index) => (
                  <div key={index} className="warning-item">
                    <strong>Row {warning.rowNumber || 'N/A'}:</strong>{' '}
                    {warning.message}
                  </div>
                ))}
                {results.warnings.length > 5 && (
                  <p className="more-warnings">
                    ...and {results.warnings.length - 5} more warnings
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Errors */}
          {results.errors && results.errors.length > 0 && (
            <div className="errors-section">
              <div className="errors-header">
                <h4>❌ Errors ({results.errors.length})</h4>
                <button
                  className="btn-download-errors"
                  onClick={downloadErrorReport}
                  type="button"
                >
                  📥 Download Error Report
                </button>
              </div>

              <div className="errors-list">
                {results.errors.slice(0, 10).map((error, index) => (
                  <div key={index} className="error-item">
                    <strong>Row {error.rowNumber || 'N/A'}:</strong>
                    <ul>
                      {error.errors?.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      )) || <li>{error.error || 'Unknown error'}</li>}
                    </ul>
                  </div>
                ))}
                {results.errors.length > 10 && (
                  <p className="more-errors">
                    ...and {results.errors.length - 10} more errors (download report to see all)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {results.success && results.failureCount === 0 && (
            <div className="success-message">
              <p>
                🎉 All {results.successCount} {currentType.label.toLowerCase()} records were imported successfully!
                {results.updatedCount > 0 && ` ${results.updatedCount} existing records were updated.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminGTFSSettings;
