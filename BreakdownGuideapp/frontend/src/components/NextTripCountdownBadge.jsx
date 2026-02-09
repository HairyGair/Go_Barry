/**
 * Go BARRY Breakdown Management System
 * Next Trip Countdown Badge Component
 *
 * Displays an escalating countdown alert when the vehicle's next scheduled
 * trip is approaching. Helps supervisors proactively cover or cancel trips
 * that a broken-down vehicle was supposed to operate.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useState, useEffect } from 'react';
import './NextTripCountdownBadge.css';

/**
 * Parse an HH:MM:SS time string into a Date object for today.
 * Handles GTFS times >24:00 (next-day trips) by wrapping correctly.
 */
function parseGtfsTimeToday(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2) return null;
  const [h, m, s = 0] = parts;
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  d.setHours(h, m, s);
  return d;
}

const NextTripCountdownBadge = ({ nextTrip, nextTripAction, compact = false, onAction }) => {
  const [minutesLeft, setMinutesLeft] = useState(null);

  useEffect(() => {
    if (!nextTrip || nextTripAction) return;

    const tick = () => {
      const dep = parseGtfsTimeToday(nextTrip.departureTime);
      if (!dep) return;
      const diff = (dep - new Date()) / 60000; // minutes
      setMinutesLeft(Math.round(diff));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextTrip, nextTripAction]);

  // Don't render if no next trip or action already taken
  if (!nextTrip || nextTripAction) return null;
  if (minutesLeft === null) return null;

  // Determine urgency level
  let level, icon;
  if (minutesLeft <= 0) {
    level = 'missed';
    icon = null;
  } else if (minutesLeft <= 5) {
    level = 'critical';
    icon = null;
  } else if (minutesLeft <= 15) {
    level = 'urgent';
    icon = null;
  } else if (minutesLeft <= 30) {
    level = 'warning';
    icon = null;
  } else {
    level = 'info';
    icon = null;
  }

  // Compact mode: small badge for card header
  if (compact) {
    const labelText = minutesLeft <= 0
      ? 'MISSED'
      : `NEXT: ${minutesLeft}m${minutesLeft <= 5 ? '!' : ''}`;

    return (
      <div
        className={`next-trip-badge compact ${level}`}
        title={`Next trip departs at ${nextTrip.departureTime?.substring(0, 5)} — ${nextTrip.originStop || ''} to ${nextTrip.destStop || nextTrip.headsign || ''}`}
      >
        <span className="ntb-label">{labelText}</span>
      </div>
    );
  }

  // Full mode: detailed display for Journey tab
  const depTime = nextTrip.departureTime?.substring(0, 5) || '--:--';
  const arrTime = nextTrip.arrivalTime?.substring(0, 5) || '';
  const origin = nextTrip.originStop || '';
  const dest = nextTrip.destStop || nextTrip.headsign || '';

  return (
    <div className={`next-trip-badge full ${level}`}>
      <div className="ntb-header">
        <span className="ntb-title">
          {minutesLeft <= 0 ? 'NEXT TRIP MISSED' : 'NEXT TRIP APPROACHING'}
        </span>
        <span className={`ntb-countdown ${level}`}>
          {minutesLeft <= 0 ? 'DEPARTED' : `${minutesLeft}m`}
        </span>
      </div>

      <div className="ntb-route-detail">
        <span className="ntb-time">{depTime}</span>
        <span className="ntb-stop">{origin}</span>
        <span className="ntb-arrow">&rarr;</span>
        {arrTime && <span className="ntb-time">{arrTime}</span>}
        <span className="ntb-stop">{dest}</span>
      </div>

      <div className="ntb-actions">
        <button
          className="ntb-btn ntb-btn-cancelled"
          onClick={() => {
            onAction && onAction('cancelled');
            window.open('https://gonortheast.passenger-app.com/network/journeys/cancellations/create/service', '_blank');
          }}
        >
          Cancel Journey
        </button>
        <button
          className="ntb-btn ntb-btn-website"
          onClick={() => {
            window.open('https://gonortheast.passenger-app.com/disruptions', '_blank');
          }}
        >
          Update Website
        </button>
      </div>
    </div>
  );
};

export default NextTripCountdownBadge;
