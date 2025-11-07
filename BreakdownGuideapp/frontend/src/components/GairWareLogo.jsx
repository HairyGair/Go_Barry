/**
 * GairWare Logo Component
 * Professional branding for Go BARRY Breakdown Management System
 * © 2025 GairWare - Anthony Gair
 */

import React from 'react';
import './GairWareLogo.css';

const GairWareLogo = ({
  size = 48,
  variant = 'terminal',
  color = '#646CFF',
  showText = false,
  className = ''
}) => {
  const logoVariants = {
    terminal: (
      <>
        <path
          d="M64 10 L108 36 L108 84 L64 110 L20 84 L20 36 Z"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <circle
          cx="64"
          cy="64"
          r="26"
          fill="none"
          stroke={color}
          strokeWidth="7"
        />
        <path
          d="M64 64 L86 64 L86 72"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <rect
          x="88"
          y="70"
          width="3"
          height="10"
          fill={color}
          className="gairware-logo-cursor"
        />
      </>
    ),
    code: (
      <>
        <path
          d="M64 10 L108 36 L108 84 L64 110 L20 84 L20 36 Z"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <circle
          cx="64"
          cy="64"
          r="26"
          fill="none"
          stroke={color}
          strokeWidth="7"
        />
        <path
          d="M64 64 L86 64 M86 58 L86 70"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M88 64 L92 60 M88 64 L92 68"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.6"
        />
      </>
    ),
    minimal: (
      <>
        <path
          d="M64 10 L108 36 L108 84 L64 110 L20 84 L20 36 Z"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <circle
          cx="64"
          cy="64"
          r="28"
          fill="none"
          stroke={color}
          strokeWidth="6"
        />
        <line
          x1="64"
          y1="64"
          x2="90"
          y2="64"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </>
    )
  };

  if (showText) {
    return (
      <div className={`gairware-logo-lockup ${className}`}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          className="gairware-logo-mark"
          aria-label="GairWare Logo"
        >
          {logoVariants[variant]}
        </svg>
        <div className="gairware-wordmark">
          <span className="gairware-text-bold">Gair</span>
          <span className="gairware-text-regular">Ware</span>
        </div>
      </div>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      className={`gairware-logo ${className}`}
      aria-label="GairWare Logo"
    >
      {logoVariants[variant]}
    </svg>
  );
};

export default GairWareLogo;
