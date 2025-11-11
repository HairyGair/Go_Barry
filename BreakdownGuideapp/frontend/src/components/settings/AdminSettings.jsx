/**
 * Admin Settings Component
 * Admin-only interface for managing supervisors, resetting passwords, and importing fleet data
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api-client.js';
import AdminFleetImportSettings from '../AdminFleetImportSettings.jsx';
import AdminGTFSSettings from '../AdminGTFSSettings.jsx';

const AdminSettings = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin tab state
  const [adminTab, setAdminTab] = useState('supervisors'); // 'supervisors', 'fleet', or 'gtfs'

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetting, setResetting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load supervisors on mount
  useEffect(() => {
    loadSupervisors();
  }, []);

  // Fetch all supervisors
  const loadSupervisors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get('/api/auth/supervisors');
      setSupervisors(data || []);
    } catch (err) {
      console.error('Failed to load supervisors:', err);
      setError('Failed to load supervisors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open password reset modal
  const openResetModal = (supervisor) => {
    setSelectedSupervisor(supervisor);
    setShowResetModal(true);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setSuccessMessage('');
  };

  // Close password reset modal
  const closeResetModal = () => {
    setShowResetModal(false);
    setSelectedSupervisor(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  // Validate password
  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return null;
  };

  // Handle password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setPasswordError('');
    setSuccessMessage('');

    // Validate password
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setResetting(true);

      // Call admin password reset endpoint
      const response = await apiClient.post('/api/auth/admin/reset-password', {
        email: selectedSupervisor.email,
        newPassword: newPassword
      });

      if (response.success) {
        setSuccessMessage(`Password updated successfully for ${selectedSupervisor.name}`);

        // Close modal after 2 seconds
        setTimeout(() => {
          closeResetModal();
        }, 2000);
      } else {
        setPasswordError(response.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setPasswordError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  // Format role badge
  const getRoleBadge = (role) => {
    const roleStyles = {
      admin: {
        bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        label: 'Admin'
      },
      manager: {
        bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        label: 'Manager'
      },
      supervisor: {
        bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        label: 'Supervisor'
      }
    };

    const style = roleStyles[role?.toLowerCase()] || roleStyles.supervisor;

    return (
      <span style={{
        padding: '4px 10px',
        background: style.bg,
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'capitalize'
      }}>
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="settings-section">
        <h2>Admin Controls</h2>
        <p className="section-description">Loading supervisors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-section">
        <h2>Admin Controls</h2>
        <div className="info-box error">
          <p>{error}</p>
        </div>
        <button
          className="settings-button"
          onClick={loadSupervisors}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <h2>Admin Controls</h2>
      <p className="section-description">
        Manage supervisor accounts, reset passwords, and import fleet data. Only administrators can access this section.
      </p>

      {/* Admin Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-color, #444444)',
        paddingBottom: '0'
      }}>
        <button
          onClick={() => setAdminTab('supervisors')}
          style={{
            padding: '12px 20px',
            background: adminTab === 'supervisors' ? 'var(--primary-color, #667eea)' : 'transparent',
            color: adminTab === 'supervisors' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: adminTab === 'supervisors' ? '3px solid var(--primary-color, #667eea)' : 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            marginBottom: '-1px'
          }}
          onMouseEnter={(e) => {
            if (adminTab !== 'supervisors') {
              e.target.style.background = 'rgba(102, 126, 234, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (adminTab !== 'supervisors') {
              e.target.style.background = 'transparent';
            }
          }}
        >
          👥 Supervisors
        </button>
        <button
          onClick={() => setAdminTab('fleet')}
          style={{
            padding: '12px 20px',
            background: adminTab === 'fleet' ? 'var(--primary-color, #667eea)' : 'transparent',
            color: adminTab === 'fleet' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: adminTab === 'fleet' ? '3px solid var(--primary-color, #667eea)' : 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            marginBottom: '-1px'
          }}
          onMouseEnter={(e) => {
            if (adminTab !== 'fleet') {
              e.target.style.background = 'rgba(102, 126, 234, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (adminTab !== 'fleet') {
              e.target.style.background = 'transparent';
            }
          }}
        >
          🚌 Fleet Database
        </button>
        <button
          onClick={() => setAdminTab('gtfs')}
          style={{
            padding: '12px 20px',
            background: adminTab === 'gtfs' ? 'var(--primary-color, #667eea)' : 'transparent',
            color: adminTab === 'gtfs' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: adminTab === 'gtfs' ? '3px solid var(--primary-color, #667eea)' : 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            marginBottom: '-1px'
          }}
          onMouseEnter={(e) => {
            if (adminTab !== 'gtfs') {
              e.target.style.background = 'rgba(102, 126, 234, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (adminTab !== 'gtfs') {
              e.target.style.background = 'transparent';
            }
          }}
        >
          🗺️ GTFS Data
        </button>
        <button
          onClick={() => setAdminTab('test')}
          style={{
            padding: '12px 20px',
            background: adminTab === 'test' ? 'var(--primary-color, #667eea)' : 'transparent',
            color: adminTab === 'test' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: adminTab === 'test' ? '3px solid var(--primary-color, #667eea)' : 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            marginBottom: '-1px'
          }}
          onMouseEnter={(e) => {
            if (adminTab !== 'test') {
              e.target.style.background = 'rgba(102, 126, 234, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (adminTab !== 'test') {
              e.target.style.background = 'transparent';
            }
          }}
        >
          🧪 Test Pages
        </button>
      </div>

      {/* Supervisors Tab */}
      {adminTab === 'supervisors' && (
        <>
          <div className="info-box">
            <p>You have admin privileges. Use this page to manage {supervisors.length} supervisor accounts.</p>
          </div>

          {/* Supervisors Table */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Supervisor Accounts
        </h3>

        <div style={{
          background: 'var(--bg-tertiary, #2a2a2a)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1fr',
            gap: '16px',
            padding: '16px 20px',
            background: 'var(--bg-input, #333333)',
            fontWeight: '600',
            fontSize: '13px',
            color: 'var(--text-secondary, #a0a0a0)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Depot</div>
            <div>Actions</div>
          </div>

          {/* Table Rows */}
          {supervisors.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary, #a0a0a0)'
            }}>
              No supervisors found
            </div>
          ) : (
            supervisors.map((supervisor) => (
              <div
                key={supervisor.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1fr',
                  gap: '16px',
                  padding: '16px 20px',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-color, #444444)',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #333333)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  color: 'var(--text-primary)',
                  fontWeight: '500',
                  fontSize: '14px'
                }}>
                  {supervisor.name || supervisor.full_name}
                </div>

                <div style={{
                  color: 'var(--text-secondary)',
                  fontSize: '13px'
                }}>
                  {supervisor.email}
                </div>

                <div>
                  {getRoleBadge(supervisor.role)}
                </div>

                <div style={{
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}>
                  {supervisor.depot || 'N/A'}
                </div>

                <div>
                  <button
                    className="settings-button secondary"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={() => openResetModal(supervisor)}
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && selectedSupervisor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-secondary, #1a1a1a)',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--border-color, #444444)'
          }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '22px',
              color: 'var(--text-primary)'
            }}>
              Reset Password
            </h3>

            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}>
              Reset password for {selectedSupervisor.name}
            </p>

            <form onSubmit={handleResetPassword}>
              {/* Email (readonly) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="settings-input"
                  value={selectedSupervisor.email}
                  readOnly
                  style={{ width: '100%' }}
                />
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)'
                }}>
                  New Password *
                </label>
                <input
                  type="password"
                  className="settings-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  required
                  style={{ width: '100%' }}
                  disabled={resetting}
                />
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)'
                }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  className="settings-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  style={{ width: '100%' }}
                  disabled={resetting}
                />
              </div>

              {/* Error Message */}
              {passwordError && (
                <div className="info-box error" style={{ marginBottom: '20px' }}>
                  <p>{passwordError}</p>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="info-box success" style={{ marginBottom: '20px' }}>
                  <p>{successMessage}</p>
                </div>
              )}

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '24px'
              }}>
                <button
                  type="button"
                  className="settings-button secondary"
                  onClick={closeResetModal}
                  disabled={resetting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="settings-button"
                  disabled={resetting || !newPassword || !confirmPassword}
                  style={{
                    opacity: (resetting || !newPassword || !confirmPassword) ? 0.5 : 1,
                    cursor: (resetting || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {resetting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}

      {/* Fleet Import Tab */}
      {adminTab === 'fleet' && (
        <>
          <div className="info-box">
            <p>Import or update vehicle fleet data from a CSV file. This will update existing vehicles or add new ones to the database.</p>
          </div>

          <AdminFleetImportSettings />
        </>
      )}

      {/* GTFS Data Tab */}
      {adminTab === 'gtfs' && (
        <>
          <div className="info-box">
            <p>Import GTFS (General Transit Feed Specification) data files to update routes, stops, trips, and stop times. These files are regularly updated and can be uploaded here to keep the transit data current.</p>
          </div>

          <AdminGTFSSettings />
        </>
      )}

      {/* Test Pages Tab */}
      {adminTab === 'test' && (
        <>
          <div className="info-box">
            <p>Access experimental and test features under development. These pages contain new dashboards and features that are being tested.</p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 style={{ marginTop: '0', fontSize: '16px', fontWeight: '600' }}>Available Test Pages</h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginTop: '16px'
            }}>
              {/* GTFS Live Route Status */}
              <div style={{
                background: 'var(--bg-secondary, #1a1a1a)',
                border: '1px solid var(--border-color, #444444)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                  🗺️ Live Route Status Dashboard
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Real-time monitoring of all 225 bus routes with status indicators (Green/Amber/Red) based on active breakdowns.
                </p>
                <a
                  href="/dashboards/gtfs/routes"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '10px 16px',
                    background: 'var(--primary-color, #667eea)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = '0.8';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '1';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Open Dashboard →
                </a>
              </div>

              {/* Fleet Defect Intelligence */}
              <div style={{
                background: 'var(--bg-secondary, #1a1a1a)',
                border: '1px solid var(--border-color, #444444)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                  🔍 Fleet Defect Intelligence
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Real-time monitoring of vehicle defects, repair trends, predictive maintenance alerts, and depot-specific issue hotspots across your entire fleet.
                </p>
                <a
                  href="/dashboards/fleet-defects"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '10px 16px',
                    background: '#dc2626',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = '0.8';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '1';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Open Dashboard →
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSettings;
