/**
 * WizardContextHeader - single-row, always-visible assessment context bar
 *
 * A supervisor is on a live phone call with a driver while running through a
 * diagnostic wizard, so this bar exists purely to keep the essentials in
 * view (which vehicle, which route, what issue, what location) without ever
 * pushing the actual question down the page. It renders once as part of the
 * sticky header stack (see App.jsx / wizard-enhancements.css) - it must NOT
 * duplicate anything shown elsewhere on the step.
 *
 * @example
 * <WizardContextHeader
 *   vehicle={{ fleetNumber: '6377', regNo: 'NK07 XXX', depot: 'SDC' }}
 *   wizardType="Steering Assessment"
 *   location={{ type: 'skip', description: 'Location to be added later' }}
 *   assessmentId="BD-1234567890"
 *   routeInfo={{ route: '21', routeName: 'Newcastle - Whitley Bay' }}
 * />
 */

import React from 'react';
import { MapPin, Building } from 'lucide-react';
import './WizardContextHeader.css';

const WizardContextHeader = ({
  vehicle,
  wizardType,
  location,
  assessmentId,
  routeInfo
}) => {
  if (!vehicle) return null;

  const fleetNumber = vehicle?.fleetNumber || vehicle?.fleet_number || 'N/A';
  const depot = vehicle?.depot || '';
  const registration = vehicle?.regNo || vehicle?.registration || '';
  const route = routeInfo?.route;
  // Only show the long name when it actually differs from the short name -
  // routeName falls back to the short name upstream when no long name is
  // known, which previously rendered as "Route 21 · 21".
  const routeNameRaw = routeInfo?.routeName;
  const routeName = (routeNameRaw && route && routeNameRaw.trim().toLowerCase() !== String(route).trim().toLowerCase())
    ? routeNameRaw
    : null;

  const isSkipped = location?.type === 'skip';
  const locationText = isSkipped
    ? 'Location to be added later'
    : (location?.description || location?.name || location?.address || '');

  return (
    <div className="wizard-context-bar">
      <div className="wcb-item wcb-fleet">
        <span className="wcb-fleet-number">{fleetNumber}</span>
        {registration && <span className="wcb-reg">{registration}</span>}
      </div>

      {depot && (
        <div className="wcb-item">
          <span className="wcb-label">Depot</span>
          <span className="wcb-value">{depot}</span>
        </div>
      )}

      {route && (
        <div className="wcb-item">
          <span className="wcb-label">Route</span>
          <span className="wcb-value">{route}{routeName ? ` · ${routeName}` : ''}</span>
        </div>
      )}

      {wizardType && (
        <div className="wcb-item">
          <span className="wcb-label">Issue</span>
          <span className="wcb-value">{wizardType}</span>
        </div>
      )}

      <div className="wcb-item wcb-location">
        {location?.type === 'depot' ? (
          <Building size={13} className="wcb-icon" />
        ) : (
          <MapPin size={13} className="wcb-icon" />
        )}
        <span className={`wcb-value${!locationText || isSkipped ? ' wcb-muted-italic' : ''}`}>
          {locationText || 'Location to be added later'}
        </span>
      </div>

      {assessmentId && (
        <div className="wcb-item wcb-id" title={`Assessment ID: ${assessmentId}`}>
          #{String(assessmentId).slice(-6)}
        </div>
      )}
    </div>
  );
};

export default WizardContextHeader;
