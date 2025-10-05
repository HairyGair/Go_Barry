/**
 * Profile Settings Component
 * Displays and manages user profile information
 */

import React from 'react';

const ProfileSettings = ({ user }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="settings-section">
      <h2>👤 Profile & Account</h2>
      <p className="section-description">
        View and manage your profile information. Some fields are managed by your administrator.
      </p>

      <div className="info-box">
        <p>💡 To update your email, name, or depot assignment, please contact your system administrator.</p>
      </div>

      {/* Display Name */}
      <div className="setting-item">
        <div className="setting-label">
          <h3>Full Name</h3>
          <p>Your display name throughout the system</p>
        </div>
        <div className="setting-control">
          <input
            type="text"
            className="settings-input"
            value={user?.name || user?.full_name || 'Not set'}
            readOnly
          />
        </div>
      </div>

      {/* Email */}
      <div className="setting-item">
        <div className="setting-label">
          <h3>Email Address</h3>
          <p>Your Go North East email (used for login)</p>
        </div>
        <div className="setting-control">
          <input
            type="email"
            className="settings-input"
            value={user?.email || 'Not set'}
            readOnly
          />
        </div>
      </div>

      {/* Depot */}
      <div className="setting-item">
        <div className="setting-label">
          <h3>Depot Assignment</h3>
          <p>Your primary depot location</p>
        </div>
        <div className="setting-control">
          <input
            type="text"
            className="settings-input"
            value={user?.depot || 'Not assigned'}
            readOnly
          />
        </div>
      </div>

      {/* Badge Number */}
      {user?.supervisorId && (
        <div className="setting-item">
          <div className="setting-label">
            <h3>Badge Number</h3>
            <p>Your supervisor badge identifier</p>
          </div>
          <div className="setting-control">
            <input
              type="text"
              className="settings-input"
              value={user?.supervisorId || user?.badge || 'Not assigned'}
              readOnly
            />
          </div>
        </div>
      )}

      {/* Role */}
      <div className="setting-item">
        <div className="setting-label">
          <h3>Role</h3>
          <p>Your access level in the system</p>
        </div>
        <div className="setting-control">
          <span className="role-badge" style={{
            padding: '6px 12px',
            background: user?.role === 'admin'
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : user?.role === 'manager'
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '13px',
            textTransform: 'capitalize'
          }}>
            {user?.role || 'Supervisor'}
          </span>
        </div>
      </div>

      {/* Account Created */}
      <div className="setting-item">
        <div className="setting-label">
          <h3>Account Created</h3>
          <p>When your account was first created</p>
        </div>
        <div className="setting-control">
          <input
            type="text"
            className="settings-input"
            value={formatDate(user?.created_at || user?.createdAt)}
            readOnly
          />
        </div>
      </div>

      {/* Last Login */}
      {user?.last_sign_in_at && (
        <div className="setting-item">
          <div className="setting-label">
            <h3>Last Login</h3>
            <p>Your most recent login time</p>
          </div>
          <div className="setting-control">
            <input
              type="text"
              className="settings-input"
              value={formatDate(user?.last_sign_in_at)}
              readOnly
            />
          </div>
        </div>
      )}

      {/* Account Actions */}
      <div className="settings-section" style={{ marginTop: '40px' }}>
        <h2>🔐 Account Actions</h2>
        <p className="section-description">
          Manage your account security and preferences
        </p>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Change Password</h3>
            <p>Update your account password for better security</p>
          </div>
          <div className="setting-control">
            <button
              className="settings-button secondary"
              onClick={() => alert('Password change feature coming in Phase 2!\nFor now, please contact IT support to reset your password.')}
            >
              Change Password
            </button>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Export My Data</h3>
            <p>Download a copy of your breakdown assessment history</p>
          </div>
          <div className="setting-control">
            <button
              className="settings-button secondary"
              onClick={() => alert('Data export feature coming soon!\nYou will be able to download your complete breakdown history in CSV or JSON format.')}
            >
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
