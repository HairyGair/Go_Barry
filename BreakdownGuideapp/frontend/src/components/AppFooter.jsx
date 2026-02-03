/**
 * App Footer Component
 * Compact single-line footer with GairWare branding
 * © 2025 GairWare - Anthony Gair
 */

import React from 'react';
import './AppFooter.css';

const AppFooter = ({ variant = 'default' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`app-footer app-footer-${variant}`}>
      <div className="footer-row">
        <span className="footer-copy">© {currentYear}</span>
        <span className="footer-brand"><strong>Gair</strong>Ware</span>
        <span className="footer-sep">·</span>
        <span className="footer-hosted">
          Hosted by{' '}
          <a
            href="https://pixelish.co.uk"
            target="_blank"
            rel="noopener noreferrer"
          >
            Pixelish
          </a>
        </span>
      </div>
    </footer>
  );
};

export default AppFooter;
