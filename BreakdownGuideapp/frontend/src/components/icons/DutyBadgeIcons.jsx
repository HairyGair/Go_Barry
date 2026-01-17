/**
 * Duty Badge Icons - Custom illustrated badges for Go BARRY
 * Each badge represents a shift with unique visual identity
 */
import React from 'react';

// Duty 100 - Early Shift (Sunrise theme)
export const Duty100Badge = ({ size = 64, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Background shield */}
    <defs>
      <linearGradient id="duty100-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="duty100-sunrise" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="50%" stopColor="#FB923C" />
        <stop offset="100%" stopColor="#F97316" />
      </linearGradient>
      <filter id="duty100-glow">
        <feGaussianBlur stdDeviation="1" result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    {/* Shield shape */}
    <path
      d="M32 2 L58 12 L58 36 C58 48 46 58 32 62 C18 58 6 48 6 36 L6 12 Z"
      fill="url(#duty100-bg)"
      stroke="#1E40AF"
      strokeWidth="2"
    />

    {/* Horizon line */}
    <path d="M12 38 Q32 32 52 38" stroke="#60A5FA" strokeWidth="2" fill="none" opacity="0.6"/>

    {/* Rising sun */}
    <circle cx="32" cy="28" r="8" fill="url(#duty100-sunrise)" filter="url(#duty100-glow)"/>

    {/* Sun rays */}
    <g stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" opacity="0.8">
      <line x1="32" y1="16" x2="32" y2="12"/>
      <line x1="40" y1="20" x2="44" y2="16"/>
      <line x1="44" y1="28" x2="48" y2="28"/>
      <line x1="20" y1="28" x2="16" y2="28"/>
      <line x1="24" y1="20" x2="20" y2="16"/>
    </g>

    {/* Duty number */}
    <text
      x="32"
      y="52"
      textAnchor="middle"
      fill="white"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="14"
      fontWeight="bold"
    >
      100
    </text>
  </svg>
);

// Duty 200 - Day Shift (Full sun theme)
export const Duty200Badge = ({ size = 64, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="duty200-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="duty200-sun" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#FACC15" />
      </linearGradient>
      <filter id="duty200-glow">
        <feGaussianBlur stdDeviation="1.5" result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    {/* Shield shape */}
    <path
      d="M32 2 L58 12 L58 36 C58 48 46 58 32 62 C18 58 6 48 6 36 L6 12 Z"
      fill="url(#duty200-bg)"
      stroke="#047857"
      strokeWidth="2"
    />

    {/* Full sun */}
    <circle cx="32" cy="26" r="10" fill="url(#duty200-sun)" filter="url(#duty200-glow)"/>

    {/* Sun rays - full radial */}
    <g stroke="#FDE047" strokeWidth="2" strokeLinecap="round">
      <line x1="32" y1="12" x2="32" y2="8"/>
      <line x1="32" y1="40" x2="32" y2="44"/>
      <line x1="18" y1="26" x2="14" y2="26"/>
      <line x1="46" y1="26" x2="50" y2="26"/>
      <line x1="22" y1="16" x2="19" y2="13"/>
      <line x1="42" y1="16" x2="45" y2="13"/>
      <line x1="22" y1="36" x2="19" y2="39"/>
      <line x1="42" y1="36" x2="45" y2="39"/>
    </g>

    {/* Duty number */}
    <text
      x="32"
      y="52"
      textAnchor="middle"
      fill="white"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="14"
      fontWeight="bold"
    >
      200
    </text>
  </svg>
);

// Duty 400 - Late Shift (Sunset theme)
export const Duty400Badge = ({ size = 64, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="duty400-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="duty400-sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="duty400-sun" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FB923C" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
    </defs>

    {/* Shield shape */}
    <path
      d="M32 2 L58 12 L58 36 C58 48 46 58 32 62 C18 58 6 48 6 36 L6 12 Z"
      fill="url(#duty400-bg)"
      stroke="#B45309"
      strokeWidth="2"
    />

    {/* Twilight sky overlay */}
    <path
      d="M32 4 L56 13 L56 28 L8 28 L8 13 Z"
      fill="url(#duty400-sky)"
    />

    {/* Horizon */}
    <path d="M10 34 L54 34" stroke="#FDE68A" strokeWidth="2" opacity="0.5"/>

    {/* Setting sun (half visible) */}
    <clipPath id="duty400-horizon">
      <rect x="10" y="10" width="44" height="24"/>
    </clipPath>
    <circle
      cx="32"
      cy="34"
      r="10"
      fill="url(#duty400-sun)"
      clipPath="url(#duty400-horizon)"
    />

    {/* City silhouette */}
    <path
      d="M12 34 L12 30 L16 30 L16 28 L20 28 L20 32 L24 32 L24 26 L28 26 L28 30 L32 30 L32 24 L36 24 L36 28 L40 28 L40 32 L44 32 L44 28 L48 28 L48 30 L52 30 L52 34 Z"
      fill="#1F2937"
      opacity="0.4"
    />

    {/* Duty number */}
    <text
      x="32"
      y="52"
      textAnchor="middle"
      fill="white"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="14"
      fontWeight="bold"
    >
      400
    </text>
  </svg>
);

// Duty 500 - Night Shift (Moon & stars theme)
export const Duty500Badge = ({ size = 64, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="duty500-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#5B21B6" />
      </linearGradient>
      <linearGradient id="duty500-moon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F3F4F6" />
        <stop offset="100%" stopColor="#D1D5DB" />
      </linearGradient>
      <filter id="duty500-glow">
        <feGaussianBlur stdDeviation="1" result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    {/* Shield shape */}
    <path
      d="M32 2 L58 12 L58 36 C58 48 46 58 32 62 C18 58 6 48 6 36 L6 12 Z"
      fill="url(#duty500-bg)"
      stroke="#4C1D95"
      strokeWidth="2"
    />

    {/* Stars */}
    <g fill="#E9D5FF" filter="url(#duty500-glow)">
      <circle cx="16" cy="16" r="1.5"/>
      <circle cx="48" cy="14" r="1"/>
      <circle cx="22" cy="24" r="1"/>
      <circle cx="50" cy="28" r="1.5"/>
      <circle cx="14" cy="32" r="1"/>
      <circle cx="44" cy="20" r="1"/>
    </g>

    {/* Twinkling stars (smaller) */}
    <g fill="#C4B5FD" opacity="0.7">
      <circle cx="20" cy="18" r="0.5"/>
      <circle cx="42" cy="32" r="0.5"/>
      <circle cx="28" cy="14" r="0.5"/>
      <circle cx="38" cy="16" r="0.5"/>
    </g>

    {/* Crescent moon */}
    <g filter="url(#duty500-glow)">
      <circle cx="34" cy="26" r="10" fill="url(#duty500-moon)"/>
      <circle cx="38" cy="24" r="8" fill="url(#duty500-bg)"/>
    </g>

    {/* Moon crater details */}
    <circle cx="30" cy="28" r="2" fill="#9CA3AF" opacity="0.3"/>
    <circle cx="32" cy="32" r="1" fill="#9CA3AF" opacity="0.2"/>

    {/* Duty number */}
    <text
      x="32"
      y="52"
      textAnchor="middle"
      fill="white"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="14"
      fontWeight="bold"
    >
      500
    </text>
  </svg>
);

// Export a map for easy lookup
export const DutyBadges = {
  '100': Duty100Badge,
  '200': Duty200Badge,
  '400': Duty400Badge,
  '500': Duty500Badge
};

// Utility component that selects the right badge
export const DutyBadge = ({ dutyCode, size = 64, className = '' }) => {
  const BadgeComponent = DutyBadges[dutyCode];
  if (!BadgeComponent) return null;
  return <BadgeComponent size={size} className={className} />;
};

export default DutyBadge;
