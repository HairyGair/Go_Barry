/**
 * Go BARRY Breakdown Management System
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, modification, or use is strictly prohibited.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useState, useEffect } from 'react';
import GairWareLogo from '../components/GairWareLogo';
import './MaintenancePage.css';

const MaintenancePage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="maintenance-page">
      {/* Animated background grid */}
      <div className="maintenance-grid"></div>

      {/* Main content */}
      <div className="maintenance-content">
        {/* Logo */}
        <div className="maintenance-logo">
          <GairWareLogo height={120} variant="icon" />
        </div>

        {/* Status icon */}
        <div className="maintenance-icon">
          🔧
        </div>

        {/* Main message */}
        <h1 className="maintenance-title">
          System Temporarily Unavailable
        </h1>

        <p className="maintenance-message">
          The Go BARRY Breakdown Management System is currently undergoing scheduled maintenance.
        </p>

        {/* Info cards */}
        <div className="maintenance-info">
          <div className="info-card">
            <div className="info-icon">⏰</div>
            <div className="info-content">
              <div className="info-label">Expected Return</div>
              <div className="info-value">Shortly</div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">📅</div>
            <div className="info-content">
              <div className="info-label">{formatDate(currentTime)}</div>
              <div className="info-value">{formatTime(currentTime)}</div>
            </div>
          </div>
        </div>

        {/* Additional info */}
        <div className="maintenance-details">
          <h2>What's Happening?</h2>
          <ul>
            <li>System updates and improvements are being applied</li>
            <li>Enhanced performance optimizations</li>
            <li>Security patches and bug fixes</li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="maintenance-contact">
          <p>
            If you need urgent assistance, please contact:
          </p>
          <div className="contact-details">
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <span className="contact-value">Operations</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">👤</span>
              <span className="contact-value">Anthony Gair (AG003)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="maintenance-footer">
          <p>Thank you for your patience</p>
          <p className="footer-copyright">
            © {new Date().getFullYear()} the operator | Powered by GairWare
          </p>
          <p className="footer-hosting">
            Hosted by{' '}
            <a href="https://pixelish.co.uk" target="_blank" rel="noopener noreferrer">
              Pixelish
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
