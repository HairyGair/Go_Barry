/**
 * App Footer Component
 * Universal footer with GairWare branding and copyright
 * Used throughout the Go BARRY Breakdown Management System
 * © 2025 GairWare - Anthony Gair
 */

import React from 'react';
import GairWareLogo from './GairWareLogo.jsx';
import './AppFooter.css';

const AppFooter = ({ variant = 'default' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`app-footer app-footer-${variant}`}>
      <div className="footer-content">
        <div className="footer-branding">
          <GairWareLogo
            size={28}
            variant="terminal"
            color="currentColor"
            className="footer-logo"
          />
          <div className="footer-text">
            <span className="footer-powered">Powered by</span>
            <span className="footer-brand">
              <strong>Gair</strong>Ware
            </span>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-info">
          <p className="footer-copyright">
            © {currentYear} GairWare. All rights reserved.
          </p>
          <p className="footer-tagline">
            Enterprise Software Solutions
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
