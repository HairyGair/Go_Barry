/**
 * GoBarry Logo Component
 * Official logo for the Go BARRY Breakdown Management System
 * Location pin with bus icon and heartbeat pulse design
 *
 * Version: 3.0.0 - Ocean Teal Modern Transport Theme
 * Last Updated: January 2026
 */
import React from 'react';

// Primary brand colors - Ocean Teal palette
const BRAND_COLORS = {
  // Ocean Teal primary colors
  teal: '#0097A7',
  tealLight: '#00ACC1',
  tealDark: '#00838F',
  tealDeep: '#006064',
  cyan: '#00BCD4',

  // Legacy blue colors (kept for dark theme compatibility)
  blue: '#00A8E8',
  navy: '#0077B6',

  // Neutral colors
  darkNavy: '#0A2540',
  charcoal: '#1F2937',
  dark: '#1A1A2E',
  white: '#FFFFFF'
};

// Get colors based on theme
const getThemeColors = (theme) => {
  if (theme === 'teal' || theme === 'light') {
    return {
      gradient: [BRAND_COLORS.cyan, BRAND_COLORS.teal, BRAND_COLORS.tealDark],
      accent: BRAND_COLORS.teal,
      highlight: BRAND_COLORS.cyan,
      text: BRAND_COLORS.charcoal,
      textAccent: BRAND_COLORS.teal
    };
  }
  // Dark theme - keeps original blue/cyan for contrast
  return {
    gradient: [BRAND_COLORS.cyan, BRAND_COLORS.blue, BRAND_COLORS.navy],
    accent: BRAND_COLORS.cyan,
    highlight: BRAND_COLORS.cyan,
    text: BRAND_COLORS.white,
    textAccent: BRAND_COLORS.cyan
  };
};

// Full logo with text
export const GoBarryLogo = ({
  size = 'md',
  variant = 'full', // 'full', 'compact', 'icon'
  theme = 'light', // 'light', 'dark', 'teal'
  className = ''
}) => {
  const sizes = {
    sm: { height: 32, iconSize: 28, iconScale: 0.35 },
    md: { height: 48, iconSize: 40, iconScale: 0.5 },
    lg: { height: 64, iconSize: 56, iconScale: 0.7 },
    xl: { height: 80, iconSize: 72, iconScale: 0.9 }
  };

  const { height, iconSize } = sizes[size] || sizes.md;
  const colors = getThemeColors(theme);
  const textColor = colors.text;

  // Icon only version (pin with bus and pulse)
  if (variant === 'icon') {
    return (
      <svg
        width={iconSize}
        height={iconSize * 1.25}
        viewBox="0 0 64 80"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Go BARRY"
      >
        <defs>
          <linearGradient id="icon-pin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.gradient[0]} />
            <stop offset="50%" stopColor={colors.gradient[1]} />
            <stop offset="100%" stopColor={colors.gradient[2]} />
          </linearGradient>
          <filter id="icon-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
          </filter>
        </defs>

        {/* Location pin shape */}
        <path d="M32 2C17.088 2 5 14.088 5 29c0 20.25 24.5 47 26 48.5.5.5 1.5.5 2 0C34.5 76 59 49.25 59 29 59 14.088 46.912 2 32 2z"
              fill="url(#icon-pin-gradient)" filter="url(#icon-shadow)"/>

        {/* Bus icon - front view */}
        <rect x="18" y="16" width="28" height="24" rx="4" ry="4" fill={BRAND_COLORS.darkNavy}/>
        <rect x="21" y="19" width="22" height="10" rx="2" ry="2" fill={BRAND_COLORS.white}/>
        <rect x="21" y="32" width="22" height="3" rx="1" fill={colors.highlight}/>
        <circle cx="24" cy="38" r="2" fill={BRAND_COLORS.white}/>
        <circle cx="40" cy="38" r="2" fill={BRAND_COLORS.white}/>

        {/* Heartbeat/pulse line */}
        <polyline points="12,52 20,52 24,46 28,58 32,48 36,56 40,52 52,52"
                  fill="none" stroke={BRAND_COLORS.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  // Compact version (icon + "GoBarry" text)
  if (variant === 'compact') {
    return (
      <svg
        height={height}
        viewBox="0 0 180 60"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Go BARRY"
      >
        <defs>
          <linearGradient id="compact-pin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.gradient[0]} />
            <stop offset="50%" stopColor={colors.gradient[1]} />
            <stop offset="100%" stopColor={colors.gradient[2]} />
          </linearGradient>
        </defs>

        {/* Icon - scaled down */}
        <g transform="translate(2, 2) scale(0.7)">
          <path d="M32 2C17.088 2 5 14.088 5 29c0 20.25 24.5 47 26 48.5.5.5 1.5.5 2 0C34.5 76 59 49.25 59 29 59 14.088 46.912 2 32 2z"
                fill="url(#compact-pin-gradient)"/>
          <rect x="18" y="16" width="28" height="24" rx="4" ry="4" fill={BRAND_COLORS.darkNavy}/>
          <rect x="21" y="19" width="22" height="10" rx="2" ry="2" fill={BRAND_COLORS.white}/>
          <rect x="21" y="32" width="22" height="3" rx="1" fill={colors.highlight}/>
          <circle cx="24" cy="38" r="2" fill={BRAND_COLORS.white}/>
          <circle cx="40" cy="38" r="2" fill={BRAND_COLORS.white}/>
          <polyline points="12,52 20,52 24,46 28,58 32,48 36,56 40,52 52,52"
                    fill="none" stroke={BRAND_COLORS.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>

        {/* GoBarry text */}
        <text
          x="58"
          y="38"
          fontFamily="'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="26"
          fontWeight="600"
        >
          <tspan fill={colors.textAccent}>Go</tspan>
          <tspan fill={textColor}>Barry</tspan>
        </text>
      </svg>
    );
  }

  // Full version (icon + GoBarry with tagline)
  return (
    <svg
      height={height}
      viewBox="0 0 240 64"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go BARRY - Breakdown Management"
    >
      <defs>
        <linearGradient id="full-pin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.gradient[0]} />
          <stop offset="50%" stopColor={colors.gradient[1]} />
          <stop offset="100%" stopColor={colors.gradient[2]} />
        </linearGradient>
        <filter id="full-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15"/>
        </filter>
      </defs>

      {/* Icon */}
      <g transform="translate(4, 2) scale(0.75)">
        <path d="M32 2C17.088 2 5 14.088 5 29c0 20.25 24.5 47 26 48.5.5.5 1.5.5 2 0C34.5 76 59 49.25 59 29 59 14.088 46.912 2 32 2z"
              fill="url(#full-pin-gradient)" filter="url(#full-shadow)"/>
        <rect x="18" y="16" width="28" height="24" rx="4" ry="4" fill={BRAND_COLORS.darkNavy}/>
        <rect x="21" y="19" width="22" height="10" rx="2" ry="2" fill={BRAND_COLORS.white}/>
        <rect x="21" y="32" width="22" height="3" rx="1" fill={colors.highlight}/>
        <circle cx="24" cy="38" r="2" fill={BRAND_COLORS.white}/>
        <circle cx="40" cy="38" r="2" fill={BRAND_COLORS.white}/>
        <polyline points="12,52 20,52 24,46 28,58 32,48 36,56 40,52 52,52"
                  fill="none" stroke={BRAND_COLORS.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* GoBarry text */}
      <text
        x="72"
        y="38"
        fontFamily="'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="32"
        fontWeight="600"
      >
        <tspan fill={colors.textAccent}>Go</tspan>
        <tspan fill={textColor}>Barry</tspan>
      </text>

      {/* Tagline */}
      <text
        x="72"
        y="56"
        fontFamily="'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="10"
        fontWeight="500"
        fill={textColor}
        opacity="0.5"
        letterSpacing="1"
      >
        BREAKDOWN MANAGEMENT
      </text>
    </svg>
  );
};

// Horizontal banner version for headers
export const GoBarryBanner = ({
  height = 48,
  theme = 'dark', // 'dark', 'light', 'teal'
  showTagline = true,
  className = ''
}) => {
  const colors = getThemeColors(theme);
  const textColor = colors.text;
  const subtleColor = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(31,41,55,0.6)';

  return (
    <svg
      height={height}
      viewBox="0 0 200 48"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go BARRY"
    >
      <defs>
        <linearGradient id="banner-pin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.gradient[0]} />
          <stop offset="50%" stopColor={colors.gradient[1]} />
          <stop offset="100%" stopColor={colors.gradient[2]} />
        </linearGradient>
      </defs>

      {/* Icon - scaled for banner */}
      <g transform="translate(2, 2) scale(0.55)">
        <path d="M32 2C17.088 2 5 14.088 5 29c0 20.25 24.5 47 26 48.5.5.5 1.5.5 2 0C34.5 76 59 49.25 59 29 59 14.088 46.912 2 32 2z"
              fill="url(#banner-pin-gradient)"/>
        <rect x="18" y="16" width="28" height="24" rx="4" ry="4" fill={BRAND_COLORS.darkNavy}/>
        <rect x="21" y="19" width="22" height="10" rx="2" ry="2" fill={BRAND_COLORS.white}/>
        <rect x="21" y="32" width="22" height="3" rx="1" fill={colors.highlight}/>
        <circle cx="24" cy="38" r="2" fill={BRAND_COLORS.white}/>
        <circle cx="40" cy="38" r="2" fill={BRAND_COLORS.white}/>
        <polyline points="12,52 20,52 24,46 28,58 32,48 36,56 40,52 52,52"
                  fill="none" stroke={BRAND_COLORS.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Text group */}
      <g>
        {/* GoBarry text */}
        <text
          x="52"
          y={showTagline ? "26" : "32"}
          fontFamily="'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="24"
          fontWeight="600"
        >
          <tspan fill={colors.textAccent}>{theme === 'dark' ? 'Go' : 'Go'}</tspan>
          <tspan fill={textColor}>Barry</tspan>
        </text>

        {/* Tagline */}
        {showTagline && (
          <text
            x="52"
            y="42"
            fontFamily="'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            fontSize="9"
            fontWeight="500"
            fill={subtleColor}
            letterSpacing="1"
          >
            BREAKDOWN MANAGEMENT
          </text>
        )}
      </g>
    </svg>
  );
};

// Simple text-only version
export const GoBarryText = ({
  size = 'md',
  theme = 'light', // 'light', 'dark', 'teal'
  className = ''
}) => {
  const sizes = {
    sm: 18,
    md: 24,
    lg: 32,
    xl: 40
  };
  const fontSize = sizes[size] || sizes.md;
  const colors = getThemeColors(theme);

  return (
    <span
      className={className}
      style={{
        fontFamily: "'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: `${fontSize}px`,
        fontWeight: 600,
        letterSpacing: '0.5px',
        color: colors.text
      }}
    >
      <span style={{ color: colors.textAccent }}>Go</span>
      <span>Barry</span>
    </span>
  );
};

export default GoBarryLogo;
