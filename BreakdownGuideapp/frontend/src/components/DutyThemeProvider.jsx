/**
 * DutyThemeProvider Component
 * Phase 8.2: Applies subtle color theming based on current duty
 *
 * Features:
 * - Sets CSS variables for duty-specific accent colors
 * - Subtle background tint based on shift
 * - Smooth transitions between themes
 */

import React, { useEffect, useState, useCallback } from 'react';

// Theme configurations for each duty shift — kept within the brand's teal/cyan
// family (no off-brand blue/amber/purple) so primary buttons stay consistent
// across the app regardless of which shift is active.
const DUTY_THEMES = {
  '100': {
    name: 'Early Shift',
    primary: '#00ACC1',
    secondary: '#26C6DA',
    accent: 'rgba(0, 172, 193, 0.08)',
    glow: 'rgba(0, 172, 193, 0.2)',
    gradient: 'linear-gradient(135deg, rgba(0, 172, 193, 0.03), rgba(38, 198, 218, 0.02))'
  },
  '200': {
    name: 'Day Shift',
    primary: '#0097A7',
    secondary: '#00BCD4',
    accent: 'rgba(0, 188, 212, 0.08)',
    glow: 'rgba(0, 188, 212, 0.2)',
    gradient: 'linear-gradient(135deg, rgba(0, 151, 167, 0.03), rgba(0, 188, 212, 0.02))'
  },
  '400': {
    name: 'Late Shift',
    primary: '#00838F',
    secondary: '#00ACC1',
    accent: 'rgba(0, 131, 143, 0.08)',
    glow: 'rgba(0, 131, 143, 0.2)',
    gradient: 'linear-gradient(135deg, rgba(0, 131, 143, 0.03), rgba(0, 172, 193, 0.02))'
  },
  '500': {
    name: 'Night Shift',
    primary: '#006064',
    secondary: '#00838F',
    accent: 'rgba(0, 96, 100, 0.08)',
    glow: 'rgba(0, 96, 100, 0.2)',
    gradient: 'linear-gradient(135deg, rgba(0, 96, 100, 0.03), rgba(0, 131, 143, 0.02))'
  }
};

// Default theme when no duty is selected
const DEFAULT_THEME = {
  name: 'Default',
  primary: '#0097A7',
  secondary: '#00BCD4',
  accent: 'rgba(0, 188, 212, 0.08)',
  glow: 'rgba(0, 188, 212, 0.2)',
  gradient: 'linear-gradient(135deg, transparent, transparent)'
};

const DutyThemeProvider = ({ children }) => {
  // State for current duty - reactive to changes
  const [currentDuty, setCurrentDuty] = useState(null);

  // Parse duty from sessionStorage
  const getDutyFromStorage = useCallback(() => {
    const stored = sessionStorage.getItem('currentDuty');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);

  // Initial load and listen for storage changes
  useEffect(() => {
    // Get initial value
    setCurrentDuty(getDutyFromStorage());

    // Listen for storage events (from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'currentDuty') {
        setCurrentDuty(getDutyFromStorage());
      }
    };

    // Custom event for same-tab changes
    const handleDutyChange = () => {
      setCurrentDuty(getDutyFromStorage());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dutyChanged', handleDutyChange);

    // Poll for changes every 2 seconds (backup for same-tab updates)
    const pollInterval = setInterval(() => {
      const newDuty = getDutyFromStorage();
      setCurrentDuty(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(newDuty)) {
          return newDuty;
        }
        return prev;
      });
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dutyChanged', handleDutyChange);
      clearInterval(pollInterval);
    };
  }, [getDutyFromStorage]);

  // Get theme based on duty code
  const theme = currentDuty?.code
    ? (DUTY_THEMES[currentDuty.code] || DEFAULT_THEME)
    : DEFAULT_THEME;

  // Apply theme CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;

    // Set theme CSS variables
    root.style.setProperty('--duty-theme-primary', theme.primary);
    root.style.setProperty('--duty-theme-secondary', theme.secondary);
    root.style.setProperty('--duty-theme-accent', theme.accent);
    root.style.setProperty('--duty-theme-glow', theme.glow);
    root.style.setProperty('--duty-theme-gradient', theme.gradient);

    // Set body class for additional theming
    document.body.classList.remove('duty-theme-100', 'duty-theme-200', 'duty-theme-400', 'duty-theme-500', 'duty-theme-default');
    if (currentDuty?.code) {
      document.body.classList.add(`duty-theme-${currentDuty.code}`);
    } else {
      document.body.classList.add('duty-theme-default');
    }

    // Cleanup
    return () => {
      document.body.classList.remove('duty-theme-100', 'duty-theme-200', 'duty-theme-400', 'duty-theme-500', 'duty-theme-default');
    };
  }, [theme, currentDuty]);

  return <>{children}</>;
};

export default DutyThemeProvider;
