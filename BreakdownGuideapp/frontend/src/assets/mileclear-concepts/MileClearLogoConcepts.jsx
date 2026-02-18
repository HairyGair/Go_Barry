import React from 'react';

/**
 * MileClear Logo Concepts
 * 4 clean, modern logo options for the rebrand
 */

// Concept 1: Wordmark with checkmark on the 'i'
export const MileClearLogo1 = ({ width = 240, dark = false }) => (
  <svg width={width} viewBox="0 0 240 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="38" fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif" fontSize="38" fontWeight="700" letterSpacing="-1">
      <tspan fill={dark ? '#e0e0e0' : '#0097A7'}>Mile</tspan>
      <tspan fill={dark ? '#ffffff' : '#1a1a2e'}>Clear</tspan>
    </text>
    {/* Checkmark replacing the dot on the 'i' */}
    <path d="M32 4 L36 9 L44 1" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// Concept 2: Icon (odometer circle) + Wordmark
export const MileClearLogo2 = ({ width = 280, dark = false }) => (
  <svg width={width} viewBox="0 0 280 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Odometer circle icon */}
    <circle cx="24" cy="24" r="20" stroke={dark ? '#e0e0e0' : '#0097A7'} strokeWidth="2.5" fill="none"/>
    <circle cx="24" cy="24" r="14" stroke={dark ? '#e0e0e0' : '#0097A7'} strokeWidth="1" fill="none" opacity="0.3"/>
    {/* Needle */}
    <line x1="24" y1="24" x2="34" y2="14" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Center dot */}
    <circle cx="24" cy="24" r="2.5" fill={dark ? '#e0e0e0' : '#0097A7'}/>
    {/* Tick marks */}
    <line x1="24" y1="6" x2="24" y2="10" stroke={dark ? '#e0e0e0' : '#0097A7'} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="38" y1="12" x2="35.5" y2="14.5" stroke={dark ? '#e0e0e0' : '#0097A7'} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="42" y1="24" x2="38" y2="24" stroke={dark ? '#e0e0e0' : '#0097A7'} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="12" x2="12.5" y2="14.5" stroke={dark ? '#e0e0e0' : '#0097A7'} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="6" y1="24" x2="10" y2="24" stroke={dark ? '#e0e0e0' : '#0097A7'} strokeWidth="1.5" strokeLinecap="round"/>
    {/* Wordmark */}
    <text x="56" y="34" fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif" fontSize="32" fontWeight="600" letterSpacing="-0.5">
      <tspan fill={dark ? '#e0e0e0' : '#0097A7'}>Mile</tspan>
      <tspan fill={dark ? '#ffffff' : '#1a1a2e'}>Clear</tspan>
    </text>
  </svg>
);

// Concept 3: Bold stacked with route line
export const MileClearLogo3 = ({ width = 240, dark = false }) => (
  <svg width={width} viewBox="0 0 240 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="40" fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif" fontSize="42" fontWeight="800" letterSpacing="-2">
      <tspan fill={dark ? '#e0e0e0' : '#0097A7'}>Mile</tspan>
      <tspan fill={dark ? '#ffffff' : '#1a1a2e'}>Clear</tspan>
    </text>
    {/* Route line underneath connecting M to r */}
    <path d="M4 50 Q60 46, 120 50 T232 48" stroke="#10B981" strokeWidth="2" strokeLinecap="round" fill="none"/>
    {/* Mile marker dots */}
    <circle cx="4" cy="50" r="2.5" fill="#10B981"/>
    <circle cx="232" cy="48" r="2.5" fill="#10B981"/>
  </svg>
);

// Concept 4: Compact badge style
export const MileClearLogo4 = ({ width = 200, dark = false }) => (
  <svg width={width} viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Rounded rectangle badge */}
    <rect x="0" y="4" width="200" height="52" rx="12" fill={dark ? 'rgba(0,151,167,0.15)' : 'rgba(0,151,167,0.08)'} stroke={dark ? 'rgba(0,151,167,0.4)' : 'rgba(0,151,167,0.2)'} strokeWidth="1.5"/>
    {/* Road icon */}
    <path d="M20 18 L20 42" stroke={dark ? '#e0e0e0' : '#0097A7'} strokeWidth="2" strokeLinecap="round"/>
    <path d="M28 18 L28 42" stroke={dark ? '#e0e0e0' : '#0097A7'} strokeWidth="2" strokeLinecap="round"/>
    {/* Dashed center line */}
    <path d="M24 20 L24 25 M24 29 L24 34 M24 38 L24 42" stroke={dark ? '#e0e0e0' : '#0097A7'} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    {/* Wordmark */}
    <text x="42" y="38" fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif" fontSize="26" fontWeight="700" letterSpacing="-0.5">
      <tspan fill={dark ? '#e0e0e0' : '#0097A7'}>Mile</tspan>
      <tspan fill={dark ? '#ffffff' : '#1a1a2e'}>Clear</tspan>
    </text>
  </svg>
);

/**
 * Preview all 4 concepts together
 */
const MileClearLogoPreview = () => (
  <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 48 }}>
    {/* Light backgrounds */}
    <div style={{ background: '#ffffff', padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'flex-start' }}>
      <h3 style={{ color: '#333', margin: 0, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Light Mode</h3>
      <div><span style={{ fontSize: 11, color: '#999', display: 'block', marginBottom: 8 }}>1. Checkmark Wordmark</span><MileClearLogo1 /></div>
      <div><span style={{ fontSize: 11, color: '#999', display: 'block', marginBottom: 8 }}>2. Odometer + Wordmark</span><MileClearLogo2 /></div>
      <div><span style={{ fontSize: 11, color: '#999', display: 'block', marginBottom: 8 }}>3. Route Line Wordmark</span><MileClearLogo3 /></div>
      <div><span style={{ fontSize: 11, color: '#999', display: 'block', marginBottom: 8 }}>4. Badge Style</span><MileClearLogo4 /></div>
    </div>

    {/* Dark backgrounds */}
    <div style={{ background: '#1a1a2e', padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'flex-start' }}>
      <h3 style={{ color: '#999', margin: 0, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Dark Mode</h3>
      <div><span style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 8 }}>1. Checkmark Wordmark</span><MileClearLogo1 dark /></div>
      <div><span style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 8 }}>2. Odometer + Wordmark</span><MileClearLogo2 dark /></div>
      <div><span style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 8 }}>3. Route Line Wordmark</span><MileClearLogo3 dark /></div>
      <div><span style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 8 }}>4. Badge Style</span><MileClearLogo4 dark /></div>
    </div>
  </div>
);

export default MileClearLogoPreview;
