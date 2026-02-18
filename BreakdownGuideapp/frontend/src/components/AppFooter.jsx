/**
 * App Footer Component
 * Compact branded footer with GairWare logo + Pixelish logo
 * Consistent across all screens
 */

import React from 'react';
import GairWareLogo from './GairWareLogo';
import PixelishLogo from './PixelishLogo';
import './AppFooter.css';

const AppFooter = ({ variant = 'default' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`af-footer af-${variant}`}>
      <div className="af-inner">
        <div className="af-left">
          <GairWareLogo height={18} variant="icon" />
          <span className="af-brand"><strong>Gair</strong>Ware</span>
        </div>

        <span className="af-copy">&copy; {currentYear}</span>

        <div className="af-right">
          <span className="af-hosted">
            Hosted by{' '}
            <a
              href="https://pixelish.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="af-pixelish-link"
            >
              <PixelishLogo height={14} />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
