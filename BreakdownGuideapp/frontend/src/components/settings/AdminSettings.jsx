/**
 * Admin Settings Component
 * Admin-only interface for managing supervisors and resetting passwords
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api-client.js';

const AdminSettings = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        Manage supervisor accounts and reset passwords. Only administrators can access this section.
      </p>

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
    </div>
  );
};

export default AdminSettings;
