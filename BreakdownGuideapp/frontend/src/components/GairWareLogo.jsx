/**
 * GairWare G-Sphere Logo Component
 * Professional branding for Go BARRY Breakdown Management System
 * © 2026 GairWare - Anthony Gair
 */

import React from 'react';

/**
 * GairWare G-Sphere Logo Component
 *
 * Variants:
 * - 'full' - Full logo with text and tagline
 * - 'standard' - Logo with text, no tagline
 * - 'icon' - Icon only (G-sphere) - default
 * - 'mono' - Monochrome version
 *
 * @param {string} variant - Logo variant
 * @param {number} height - Height in pixels (default: 40)
 * @param {string} theme - 'dark' or 'light'
 * @param {string} className - Additional CSS classes
 */
const GairWareLogo = ({
  variant = 'icon',
  height = 40,
  theme = 'dark',
  className = '',
  style = {}
}) => {
  // Calculate widths based on variant and height
  const getViewBox = () => {
    switch (variant) {
      case 'full': return '0 0 500 180';
      case 'standard': return '0 0 400 120';
      case 'icon':
      case 'mono':
      default: return '0 0 120 120';
    }
  };

  const getWidth = () => {
    switch (variant) {
      case 'full': return (height / 180) * 500;
      case 'standard': return (height / 120) * 400;
      case 'icon':
      case 'mono':
      default: return height;
    }
  };

  const textColor = theme === 'light' ? '#1a1a1a' : '#ffffff';
  const uniqueId = React.useId().replace(/:/g, '');

  // Icon Only variant
  if (variant === 'icon') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={getViewBox()}
        width={getWidth()}
        height={height}
        className={className}
        style={style}
        aria-label="GairWare Logo"
      >
        <defs>
          <linearGradient id={`chrome-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FF8080' }}/>
            <stop offset="25%" style={{ stopColor: '#FF3B3B' }}/>
            <stop offset="50%" style={{ stopColor: '#CC2020' }}/>
            <stop offset="75%" style={{ stopColor: '#FF3B3B' }}/>
            <stop offset="100%" style={{ stopColor: '#FF6060' }}/>
          </linearGradient>
          <radialGradient id={`sphere-${uniqueId}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" style={{ stopColor: '#252525' }}/>
            <stop offset="60%" style={{ stopColor: '#151515' }}/>
            <stop offset="100%" style={{ stopColor: '#0a0a0a' }}/>
          </radialGradient>
          <linearGradient id={`ring-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#FF3B3B00' }}/>
            <stop offset="30%" style={{ stopColor: '#FF3B3B' }}/>
            <stop offset="70%" style={{ stopColor: '#FF3B3B' }}/>
            <stop offset="100%" style={{ stopColor: '#FF3B3B00' }}/>
          </linearGradient>
          <filter id={`glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="60" cy="60" r="50" fill={`url(#sphere-${uniqueId})`} stroke={`url(#chrome-${uniqueId})`} strokeWidth="2.5"/>
        <path d="M10 60 Q35 48 60 45 Q85 48 110 60" fill="none" stroke={`url(#ring-${uniqueId})`} strokeWidth="1.5" opacity="0.4"/>
        <g filter={`url(#glow-${uniqueId})`}>
          <path
            d="M85 38 L42 38 L25 60 L42 82 L85 82 L85 62 L58 62"
            fill="none"
            stroke={`url(#chrome-${uniqueId})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <path d="M10 60 Q35 72 60 75 Q85 72 110 60" fill="none" stroke={`url(#ring-${uniqueId})`} strokeWidth="2"/>
        <circle cx="60" cy="6" r="4" fill="#FF3B3B"/>
        <circle cx="60" cy="114" r="4" fill="#FF3B3B"/>
      </svg>
    );
  }

  // Monochrome variant
  if (variant === 'mono') {
    const monoColor = theme === 'light' ? '#1a1a1a' : '#ffffff';
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={getViewBox()}
        width={getWidth()}
        height={height}
        className={className}
        style={style}
        aria-label="GairWare Logo"
      >
        <defs>
          <linearGradient id={`ring-mono-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: `${monoColor}00` }}/>
            <stop offset="30%" style={{ stopColor: monoColor }}/>
            <stop offset="70%" style={{ stopColor: monoColor }}/>
            <stop offset="100%" style={{ stopColor: `${monoColor}00` }}/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="50" fill="none" stroke={monoColor} strokeWidth="2"/>
        <path d="M10 60 Q35 48 60 45 Q85 48 110 60" fill="none" stroke={`url(#ring-mono-${uniqueId})`} strokeWidth="1.5" opacity="0.3"/>
        <path
          d="M85 38 L42 38 L25 60 L42 82 L85 82 L85 62 L58 62"
          fill="none"
          stroke={monoColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10 60 Q35 72 60 75 Q85 72 110 60" fill="none" stroke={`url(#ring-mono-${uniqueId})`} strokeWidth="2"/>
        <circle cx="60" cy="6" r="3" fill={monoColor}/>
        <circle cx="60" cy="114" r="3" fill={monoColor}/>
      </svg>
    );
  }

  // Standard variant (with text, no tagline)
  if (variant === 'standard') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={getViewBox()}
        width={getWidth()}
        height={height}
        className={className}
        style={style}
        aria-label="GairWare Logo"
      >
        <defs>
          <linearGradient id={`chrome-std-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FF8080' }}/>
            <stop offset="25%" style={{ stopColor: '#FF3B3B' }}/>
            <stop offset="50%" style={{ stopColor: '#CC2020' }}/>
            <stop offset="75%" style={{ stopColor: '#FF3B3B' }}/>
            <stop offset="100%" style={{ stopColor: '#FF6060' }}/>
          </linearGradient>
          <radialGradient id={`sphere-std-${uniqueId}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" style={{ stopColor: '#252525' }}/>
            <stop offset="60%" style={{ stopColor: '#151515' }}/>
            <stop offset="100%" style={{ stopColor: '#0a0a0a' }}/>
          </radialGradient>
          <linearGradient id={`ring-std-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#FF3B3B00' }}/>
            <stop offset="30%" style={{ stopColor: '#FF3B3B' }}/>
            <stop offset="70%" style={{ stopColor: '#FF3B3B' }}/>
            <stop offset="100%" style={{ stopColor: '#FF3B3B00' }}/>
          </linearGradient>
          <filter id={`glow-std-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="55" cy="60" r="45" fill={`url(#sphere-std-${uniqueId})`} stroke={`url(#chrome-std-${uniqueId})`} strokeWidth="2"/>
        <path d="M10 60 Q32 50 55 48 Q78 50 100 60" fill="none" stroke={`url(#ring-std-${uniqueId})`} strokeWidth="1.5" opacity="0.4"/>
        <g filter={`url(#glow-std-${uniqueId})`}>
          <path
            d="M78 35 L38 35 L22 60 L38 85 L78 85 L78 62 L55 62"
            fill="none"
            stroke={`url(#chrome-std-${uniqueId})`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <path d="M10 60 Q32 70 55 72 Q78 70 100 60" fill="none" stroke={`url(#ring-std-${uniqueId})`} strokeWidth="2"/>
        <circle cx="55" cy="12" r="3" fill="#FF3B3B"/>
        <circle cx="55" cy="108" r="3" fill="#FF3B3B"/>
        <text
          x="120"
          y="68"
          fontFamily="'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="32"
          fontWeight="800"
          letterSpacing="5"
          fill={textColor}
        >
          GAIRWARE
        </text>
      </svg>
    );
  }

  // Full variant (with text and tagline)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={getViewBox()}
      width={getWidth()}
      height={height}
      className={className}
      style={style}
      aria-label="GairWare Logo"
    >
      <defs>
        {/* Main chrome gradient */}
        <linearGradient id={`chromeMain-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FF8080' }}/>
          <stop offset="25%" style={{ stopColor: '#FF3B3B' }}/>
          <stop offset="50%" style={{ stopColor: '#CC2020' }}/>
          <stop offset="75%" style={{ stopColor: '#FF3B3B' }}/>
          <stop offset="100%" style={{ stopColor: '#FF6060' }}/>
        </linearGradient>

        {/* Sphere inner gradient */}
        <radialGradient id={`sphereInner-${uniqueId}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" style={{ stopColor: '#252525' }}/>
          <stop offset="60%" style={{ stopColor: '#151515' }}/>
          <stop offset="100%" style={{ stopColor: '#0a0a0a' }}/>
        </radialGradient>

        {/* Sphere highlight */}
        <radialGradient id={`sphereHighlight-${uniqueId}`} cx="30%" cy="25%" r="40%">
          <stop offset="0%" style={{ stopColor: '#ffffff15' }}/>
          <stop offset="100%" style={{ stopColor: '#ffffff00' }}/>
        </radialGradient>

        {/* Ring gradient */}
        <linearGradient id={`ringGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#FF3B3B00' }}/>
          <stop offset="30%" style={{ stopColor: '#FF3B3B' }}/>
          <stop offset="70%" style={{ stopColor: '#FF3B3B' }}/>
          <stop offset="100%" style={{ stopColor: '#FF3B3B00' }}/>
        </linearGradient>

        {/* Glow filter */}
        <filter id={`glowMain-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Outer glow */}
        <filter id={`outerGlow-${uniqueId}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="blur"/>
          <feFlood floodColor="#FF3B3B" floodOpacity="0.3"/>
          <feComposite in2="blur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow ring */}
      <ellipse cx="80" cy="90" rx="62" ry="62" fill="none" stroke="#FF3B3B" strokeWidth="1" opacity="0.15" filter={`url(#outerGlow-${uniqueId})`}/>

      {/* Main sphere */}
      <circle cx="80" cy="90" r="58" fill={`url(#sphereInner-${uniqueId})`} stroke={`url(#chromeMain-${uniqueId})`} strokeWidth="2.5"/>

      {/* Sphere highlight overlay */}
      <circle cx="80" cy="90" r="56" fill={`url(#sphereHighlight-${uniqueId})`}/>

      {/* Horizontal ring - back half (behind G) */}
      <path d="M22 90 Q50 78 80 75 Q110 78 138 90" fill="none" stroke={`url(#ringGrad-${uniqueId})`} strokeWidth="2" opacity="0.4"/>

      {/* Angular G inside sphere */}
      <g filter={`url(#glowMain-${uniqueId})`}>
        <path
          d="M108 55 L58 55 L38 90 L58 125 L108 125 L108 95 L78 95"
          fill="none"
          stroke={`url(#chromeMain-${uniqueId})`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Horizontal ring - front half (in front of G) */}
      <path d="M22 90 Q50 102 80 105 Q110 102 138 90" fill="none" stroke={`url(#ringGrad-${uniqueId})`} strokeWidth="2.5"/>

      {/* Top node */}
      <circle cx="80" cy="28" r="4" fill="#FF3B3B" filter={`url(#glowMain-${uniqueId})`}/>
      {/* Bottom node */}
      <circle cx="80" cy="152" r="4" fill="#FF3B3B" filter={`url(#glowMain-${uniqueId})`}/>

      {/* Subtle scan lines on sphere for tech feel */}
      <line x1="35" y1="70" x2="125" y2="70" stroke="#FF3B3B" strokeWidth="0.5" opacity="0.1"/>
      <line x1="30" y1="90" x2="130" y2="90" stroke="#FF3B3B" strokeWidth="0.5" opacity="0.15"/>
      <line x1="35" y1="110" x2="125" y2="110" stroke="#FF3B3B" strokeWidth="0.5" opacity="0.1"/>

      {/* GAIRWARE text */}
      <text
        x="165"
        y="82"
        fontFamily="'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="42"
        fontWeight="800"
        letterSpacing="6"
        fill={textColor}
      >
        GAIRWARE
      </text>

      {/* Tagline */}
      <text
        x="165"
        y="108"
        fontFamily="'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="11"
        fontWeight="400"
        letterSpacing="3"
        fill="#666"
      >
        SOFTWARE FOR PEOPLE WHO NEED IT
      </text>

      {/* Accent line under text */}
      <line x1="165" y1="120" x2="280" y2="120" stroke={`url(#chromeMain-${uniqueId})`} strokeWidth="2" opacity="0.6"/>
      <line x1="285" y1="120" x2="420" y2="120" stroke="#333" strokeWidth="1"/>
    </svg>
  );
};

export default GairWareLogo;
