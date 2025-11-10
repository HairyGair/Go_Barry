/**
 * Admin Fleet Import Settings Component
 *
 * Drag-and-drop CSV upload interface for bulk fleet vehicle imports
 * Displays import progress, results, and detailed error reports
 *
 * @author Anthony Gair
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AdminFleetImportSettings.css';

const AdminFleetImportSettings = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

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
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setResults(null);
      setError(null);
    } else {
      setError('Please drop a CSV file');
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
      setError(null);
    }
  };

  // Trigger file input click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Upload CSV file
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
      setError('Admin privileges required to import fleet data.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

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

      // Use production API URL or fallback to localhost for development
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
      const uploadUrl = `${apiUrl}/api/admin/fleet/import-csv`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        credentials: 'include', // CRITICAL: Include HTTP-only auth cookies
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

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload CSV file');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Download error report as CSV
  const downloadErrorReport = () => {
    if (!results || !results.errors || results.errors.length === 0) {
      return;
    }

    const csvContent = [
      'Row Number,Fleet No,Error Messages',
      ...results.errors.map(err =>
        `${err.rowNumber || 'N/A'},"${err.fleetNo || 'N/A'}","${err.errors?.join('; ') || err.error || 'Unknown error'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet_import_errors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Download template CSV
  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      const response = await fetch('http://localhost:3001/api/admin/fleet/import-template', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fleet_import_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Template download error:', err);
      setError('Failed to download template');
    }
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

  return (
    <div className="admin-fleet-import">
      <div className="import-header">
        <h2>Fleet Vehicle CSV Import</h2>
        <p className="import-description">
          Upload a CSV file to import or update fleet vehicle data in bulk.
          The CSV must contain a <strong>FleetNo</strong> column.
        </p>
      </div>

      {/* Download Template Button */}
      <div className="template-section">
        <button
          className="btn-download-template"
          onClick={downloadTemplate}
          type="button"
        >
          📥 Download CSV Template
        </button>
        <p className="template-info">
          Download a sample CSV template with the correct column format
        </p>
      </div>

      {/* CSV Requirements */}
      <div className="csv-requirements">
        <h3>CSV Requirements</h3>
        <ul>
          <li><strong>FleetNo</strong> - Required, must be unique (e.g., 6377)</li>
          <li><strong>RegNumber</strong> - Optional (e.g., NK19ABC)</li>
          <li><strong>OperatingDepotCode</strong> - Optional (e.g., Washington)</li>
          <li><strong>VehicleType Equinox</strong> - Optional (e.g., Streetlite)</li>
        </ul>
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
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {!file ? (
          <>
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              Drag and drop your CSV file here
            </p>
            <p className="upload-subtext">or</p>
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
                <p className="file-size">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
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
          {uploading ? 'Uploading...' : '🚀 Upload and Import'}
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
                <div className="stat-label">Updated (Duplicates)</div>
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
                    {warning.fleetNo && <span> (Fleet: {warning.fleetNo})</span>}
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
                    {error.fleetNo && <span> Fleet {error.fleetNo}</span>}
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
                🎉 All {results.successCount} vehicles were imported successfully!
                {results.updatedCount > 0 && ` ${results.updatedCount} existing records were updated.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFleetImportSettings;
