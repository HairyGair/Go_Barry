import React, { useState } from 'react';
import { apiConfig } from '../breakdown-guide/components/common/constants';
import { supabase } from '../services/supabase-client';
import { useAuth } from '../contexts/AuthContext.jsx';
import './ChangePasswordModal.css';

const ChangePasswordModal = ({ isOpen, onClose, userEmail }) => {
  const { currentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setError('Password must contain uppercase, lowercase, numbers, and special characters');
      return;
    }

    setIsLoading(true);

    try {
      // Try to get the Supabase session for the Authorization header
      let authHeader = undefined;

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!sessionError && session?.access_token) {
          authHeader = `Bearer ${session.access_token}`;
          console.log('✅ Using Supabase access token for auth');
        } else {
          console.log('⚠️ No Supabase session found, backend will use auth bypass');
        }
      } catch (sessionErr) {
        console.log('⚠️ Failed to get Supabase session:', sessionErr.message);
        console.log('Backend will use auth bypass');
      }

      // Make the API request - backend has auth bypass enabled so this will work
      // even without a valid token
      const headers = {
        'Content-Type': 'application/json'
      };

      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await fetch(`${apiConfig.baseUrl}/api/auth/change-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: userEmail || currentUser?.email,
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('✅ Password changed successfully!');
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('');
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Change password error:', err);
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="change-password-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔐 Change Password</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {userEmail && (
            <div className="user-info">
              <p><strong>Account:</strong> {userEmail}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">
                Current Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">
                New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
              <small className="password-hint">
                Must be 8+ characters with uppercase, lowercase, numbers, and special characters
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            <div className="show-password-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={() => setShowPasswords(!showPasswords)}
                  disabled={isLoading}
                />
                <span>Show passwords</span>
              </label>
            </div>

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                {success}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isLoading}
              >
                {isLoading ? '⏳ Changing...' : '🔒 Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
