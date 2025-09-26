// Secure Password Input Component with Strength Indicator and Validation
// Provides real-time password validation, strength meter, and security feedback

import React, { useState, useEffect, useCallback } from 'react';
import { passwordValidator } from '../services/security-service.js';

const SecurePasswordInput = ({
  value = '',
  onChange,
  onValidationChange,
  placeholder = 'Enter your password',
  disabled = false,
  showStrengthMeter = true,
  showValidation = true,
  showToggle = true,
  validateOnChange = true,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  // Validate password on change
  const validatePassword = useCallback((password) => {
    if (!password && !hasBeenTouched) return null;

    const result = passwordValidator.validate(password);
    setValidation(result);

    // Notify parent component of validation changes
    if (onValidationChange) {
      onValidationChange(result);
    }

    return result;
  }, [onValidationChange, hasBeenTouched]);

  // Effect to validate password when value changes
  useEffect(() => {
    if (validateOnChange) {
      validatePassword(value);
    }
  }, [value, validateOnChange, validatePassword]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(e);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setHasBeenTouched(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (value) {
      validatePassword(value);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getStrengthColor = (strength) => {
    const colors = {
      'very-strong': '#00C851',
      'strong': '#2BBBAD',
      'medium': '#FF8800',
      'weak': '#FF4444',
      'very-weak': '#CC0000'
    };
    return colors[strength] || '#E0E0E0';
  };

  const getStrengthWidth = (score) => {
    return Math.min((score / 100) * 100, 100);
  };

  return (
    <div className={`secure-password-input ${className}`}>
      <div className="password-field-container">
        <div className={`password-field ${isFocused ? 'focused' : ''} ${validation?.isValid === false ? 'error' : ''}`}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="password-input"
            autoComplete="current-password"
            {...props}
          />

          {showToggle && (
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
              disabled={disabled}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </button>
          )}
        </div>

        {/* Password Strength Meter */}
        {showStrengthMeter && validation && hasBeenTouched && (
          <div className="password-strength-meter">
            <div className="strength-bar-container">
              <div
                className="strength-bar"
                style={{
                  width: `${getStrengthWidth(validation.score)}%`,
                  backgroundColor: getStrengthColor(validation.strength),
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            <div className="strength-text">
              <span
                className={`strength-label strength-${validation.strength}`}
                style={{ color: getStrengthColor(validation.strength) }}
              >
                {passwordValidator.getStrengthMessage(validation.strength)}
              </span>
            </div>
          </div>
        )}

        {/* Validation Messages */}
        {showValidation && validation && hasBeenTouched && (
          <div className="password-validation">
            {validation.issues.length > 0 && (
              <div className="validation-issues">
                <div className="issues-header">Issues to fix:</div>
                <ul className="issues-list">
                  {validation.issues.map((issue, index) => (
                    <li key={index} className="issue-item">
                      <span className="issue-icon">⚠️</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validation.suggestions.length > 0 && (
              <div className="validation-suggestions">
                <div className="suggestions-header">Suggestions:</div>
                <ul className="suggestions-list">
                  {validation.suggestions.map((suggestion, index) => (
                    <li key={index} className="suggestion-item">
                      <span className="suggestion-icon">💡</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validation.isValid && (
              <div className="validation-success">
                <span className="success-icon">✅</span>
                Password meets all security requirements
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx="true">{`
        .secure-password-input {
          width: 100%;
          margin-bottom: 16px;
        }

        .password-field-container {
          position: relative;
          width: 100%;
        }

        .password-field {
          position: relative;
          display: flex;
          align-items: center;
          border: 2px solid #E0E6ED;
          border-radius: 8px;
          background: white;
          transition: all 0.2s ease;
        }

        .password-field.focused {
          border-color: #3182CE;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .password-field.error {
          border-color: #E53E3E;
          box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
        }

        .password-input {
          flex: 1;
          padding: 12px 16px;
          border: none;
          outline: none;
          font-size: 16px;
          background: transparent;
          color: #2D3748;
        }

        .password-input::placeholder {
          color: #A0AEC0;
        }

        .password-input:disabled {
          color: #A0AEC0;
          cursor: not-allowed;
        }

        .password-toggle {
          padding: 8px 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 16px;
          color: #718096;
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .password-toggle:hover {
          color: #3182CE;
        }

        .password-toggle:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        /* Password Strength Meter */
        .password-strength-meter {
          margin-top: 8px;
        }

        .strength-bar-container {
          width: 100%;
          height: 4px;
          background: #E2E8F0;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .strength-bar {
          height: 100%;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .strength-text {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .strength-label {
          font-size: 12px;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        /* Validation Messages */
        .password-validation {
          margin-top: 8px;
          font-size: 14px;
        }

        .validation-issues {
          margin-bottom: 8px;
        }

        .issues-header,
        .suggestions-header {
          font-weight: 600;
          margin-bottom: 4px;
          color: #2D3748;
        }

        .issues-list,
        .suggestions-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .issue-item,
        .suggestion-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-bottom: 4px;
          color: #4A5568;
          line-height: 1.4;
        }

        .issue-item {
          color: #E53E3E;
        }

        .suggestion-item {
          color: #3182CE;
        }

        .issue-icon,
        .suggestion-icon,
        .success-icon {
          font-size: 12px;
          margin-top: 1px;
          flex-shrink: 0;
        }

        .validation-success {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #38A169;
          font-weight: 500;
        }

        /* Responsive Design */
        @media (max-width: 480px) {
          .password-input {
            font-size: 16px; /* Prevent zoom on iOS */
            padding: 14px 16px;
          }

          .password-validation {
            font-size: 13px;
          }

          .strength-label {
            font-size: 11px;
          }
        }

        /* High Contrast Mode Support */
        @media (prefers-contrast: high) {
          .password-field {
            border-width: 3px;
          }

          .strength-bar {
            border: 1px solid currentColor;
          }
        }

        /* Reduced Motion Support */
        @media (prefers-reduced-motion: reduce) {
          .password-field,
          .strength-bar,
          .strength-label {
            transition: none;
          }
        }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
          .password-field {
            background: #2D3748;
            border-color: #4A5568;
          }

          .password-input {
            color: #E2E8F0;
          }

          .password-input::placeholder {
            color: #718096;
          }

          .password-field.focused {
            border-color: #63B3ED;
          }

          .strength-bar-container {
            background: #4A5568;
          }

          .issues-header,
          .suggestions-header {
            color: #E2E8F0;
          }

          .issue-item,
          .suggestion-item {
            color: #CBD5E0;
          }
        }
      `}</style>
    </div>
  );
};

export default SecurePasswordInput;