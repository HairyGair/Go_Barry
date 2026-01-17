/**
 * GoBarry Logo Component
 * Official logo for the Go BARRY Breakdown Management System
 * Blue-based brand identity
 */
import React from 'react';

// Full logo with text
export const GoBarryLogo = ({
  size = 'md',
  variant = 'full', // 'full', 'compact', 'icon'
  theme = 'light', // 'light', 'dark'
  className = ''
}) => {
  const sizes = {
    sm: { height: 32, iconSize: 28 },
    md: { height: 48, iconSize: 40 },
    lg: { height: 64, iconSize: 56 },
    xl: { height: 80, iconSize: 72 }
  };

  const { height, iconSize } = sizes[size] || sizes.md;
  const textColor = theme === 'dark' ? '#FFFFFF' : '#1E3A5F';
  const primaryBlue = '#0066CC';
  const accentCyan = '#00B4D8';

  // Icon only version (bus/wrench symbol)
  if (variant === 'icon') {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Go BARRY"
      >
        <defs>
          <linearGradient id="barry-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryBlue} />
            <stop offset="100%" stopColor={accentCyan} />
          </linearGradient>
          <filter id="barry-icon-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15"/>
          </filter>
        </defs>

        {/* Rounded square background */}
        <rect
          x="4" y="4"
          width="56" height="56"
          rx="12" ry="12"
          fill="url(#barry-icon-gradient)"
          filter="url(#barry-icon-shadow)"
        />

        {/* Bus front icon */}
        <g fill="white">
          {/* Bus body */}
          <rect x="16" y="20" width="32" height="24" rx="4" />
          {/* Windows */}
          <rect x="20" y="24" width="10" height="8" rx="1" fill={primaryBlue} opacity="0.6"/>
          <rect x="34" y="24" width="10" height="8" rx="1" fill={primaryBlue} opacity="0.6"/>
          {/* Destination display */}
          <rect x="20" y="14" width="24" height="5" rx="1" fill="white" opacity="0.9"/>
          {/* Headlights */}
          <circle cx="20" cy="40" r="2" fill={accentCyan}/>
          <circle cx="44" cy="40" r="2" fill={accentCyan}/>
          {/* Wrench overlay (subtle) */}
          <path
            d="M48 48 L52 52 M44 52 L48 48 L52 48"
            stroke={accentCyan}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
        </g>
      </svg>
    );
  }

  // Compact version (icon + "BARRY" text)
  if (variant === 'compact') {
    return (
      <svg
        height={height}
        viewBox="0 0 180 64"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Go BARRY"
      >
        <defs>
          <linearGradient id="barry-compact-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryBlue} />
            <stop offset="100%" stopColor={accentCyan} />
          </linearGradient>
        </defs>

        {/* Icon */}
        <rect
          x="4" y="4"
          width="56" height="56"
          rx="12" ry="12"
          fill="url(#barry-compact-gradient)"
        />
        <g fill="white">
          <rect x="16" y="20" width="32" height="24" rx="4" />
          <rect x="20" y="24" width="10" height="8" rx="1" fill={primaryBlue} opacity="0.6"/>
          <rect x="34" y="24" width="10" height="8" rx="1" fill={primaryBlue} opacity="0.6"/>
          <rect x="20" y="14" width="24" height="5" rx="1" fill="white" opacity="0.9"/>
          <circle cx="20" cy="40" r="2" fill={accentCyan}/>
          <circle cx="44" cy="40" r="2" fill={accentCyan}/>
        </g>

        {/* BARRY text */}
        <text
          x="72"
          y="42"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="28"
          fontWeight="800"
          fill={textColor}
          letterSpacing="1"
        >
          BARRY
        </text>
      </svg>
    );
  }

  // Full version (Go + BARRY with tagline)
  return (
    <svg
      height={height}
      viewBox="0 0 280 64"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go BARRY - Breakdown Management"
    >
      <defs>
        <linearGradient id="barry-full-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryBlue} />
          <stop offset="100%" stopColor={accentCyan} />
        </linearGradient>
      </defs>

      {/* "Go" text */}
      <text
        x="4"
        y="42"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="32"
        fontWeight="300"
        fill={textColor}
        opacity="0.7"
      >
        Go
      </text>

      {/* Icon between Go and BARRY */}
      <rect
        x="52" y="8"
        width="48" height="48"
        rx="10" ry="10"
        fill="url(#barry-full-gradient)"
      />
      <g fill="white" transform="translate(52, 8) scale(0.75)">
        <rect x="16" y="20" width="32" height="24" rx="4" />
        <rect x="20" y="24" width="10" height="8" rx="1" fill={primaryBlue} opacity="0.6"/>
        <rect x="34" y="24" width="10" height="8" rx="1" fill={primaryBlue} opacity="0.6"/>
        <rect x="20" y="14" width="24" height="5" rx="1" fill="white" opacity="0.9"/>
        <circle cx="20" cy="40" r="2" fill={accentCyan}/>
        <circle cx="44" cy="40" r="2" fill={accentCyan}/>
      </g>

      {/* "BARRY" text */}
      <text
        x="108"
        y="42"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="32"
        fontWeight="800"
        fill={textColor}
        letterSpacing="2"
      >
        BARRY
      </text>

      {/* Tagline */}
      <text
        x="108"
        y="58"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="10"
        fontWeight="500"
        fill={textColor}
        opacity="0.5"
        letterSpacing="2"
      >
        BREAKDOWN MANAGEMENT
      </text>
    </svg>
  );
};

// Horizontal banner version for headers
export const GoBarryBanner = ({
  height = 55,
  theme = 'dark',
  showTagline = true,
  className = ''
}) => {
  const textColor = theme === 'dark' ? '#FFFFFF' : '#1E3A5F';
  const subtleColor = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(30,58,95,0.6)';
  const primaryBlue = '#0066CC';
  const accentCyan = '#00B4D8';

  return (
    <svg
      height={height}
      viewBox="0 0 240 55"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go BARRY"
    >
      <defs>
        <linearGradient id="barry-banner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryBlue} />
          <stop offset="100%" stopColor={accentCyan} />
        </linearGradient>
      </defs>

      {/* Logo icon */}
      <rect
        x="0" y="2.5"
        width="50" height="50"
        rx="10" ry="10"
        fill="url(#barry-banner-gradient)"
      />

      {/* Bus icon inside */}
      <g fill="white" transform="translate(0, 2.5) scale(0.78)">
        <rect x="16" y="18" width="32" height="24" rx="4" />
        <rect x="20" y="22" width="10" height="8" rx="1" fill={primaryBlue} opacity="0.6"/>
        <rect x="34" y="22" width="10" height="8" rx="1" fill={primaryBlue} opacity="0.6"/>
        <rect x="20" y="12" width="24" height="5" rx="1" fill="white" opacity="0.9"/>
        <circle cx="20" cy="38" r="2" fill={accentCyan}/>
        <circle cx="44" cy="38" r="2" fill={accentCyan}/>
      </g>

      {/* Text group */}
      <g>
        {/* "Go" light */}
        <text
          x="60"
          y="32"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="24"
          fontWeight="300"
          fill={subtleColor}
        >
          Go
        </text>

        {/* "BARRY" bold */}
        <text
          x="92"
          y="32"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="24"
          fontWeight="800"
          fill={textColor}
          letterSpacing="1.5"
        >
          BARRY
        </text>

        {/* Tagline */}
        {showTagline && (
          <text
            x="60"
            y="48"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            fontSize="9"
            fontWeight="500"
            fill={subtleColor}
            letterSpacing="1.5"
          >
            BREAKDOWN MANAGEMENT SYSTEM
          </text>
        )}
      </g>
    </svg>
  );
};

// Simple text-only version
export const GoBarryText = ({
  size = 'md',
  theme = 'light',
  className = ''
}) => {
  const sizes = {
    sm: 18,
    md: 24,
    lg: 32,
    xl: 40
  };
  const fontSize = sizes[size] || sizes.md;
  const textColor = theme === 'dark' ? '#FFFFFF' : '#1E3A5F';
  const accentColor = '#0066CC';

  return (
    <span
      className={className}
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: `${fontSize}px`,
        fontWeight: 800,
        letterSpacing: '1px',
        color: textColor
      }}
    >
      <span style={{ fontWeight: 300, opacity: 0.7 }}>Go</span>
      <span style={{ color: accentColor, marginLeft: '4px' }}>BARRY</span>
    </span>
  );
};

export default GoBarryLogo;
