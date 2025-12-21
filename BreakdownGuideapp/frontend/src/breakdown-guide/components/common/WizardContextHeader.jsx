/**
 * WizardContextHeader - Persistent vehicle/assessment context display
 *
 * Shows the vehicle being assessed and location during wizard flow.
 * Helps supervisors maintain awareness of which vehicle they're working on.
 *
 * @example
 * <WizardContextHeader
 *   vehicle={{ fleetNumber: '6377', vehicleType: 'Single Decker', depot: 'SDC' }}
 *   wizardType="Steering Assessment"
 *   location={{ name: 'Chester-le-Street A167' }}
 *   assessmentId="BD-1234567890"
 * />
 */

import React from 'react';
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
  const vehicleType = vehicle?.vehicleType || vehicle?.type || '';
  const depot = vehicle?.depot || '';
  const registration = vehicle?.regNo || vehicle?.registration || '';

  return (
    <div className="wizard-context-header">
      {/* Vehicle Badge - Primary Focus */}
      <div className="context-vehicle-badge">
        <span className="fleet-number">{fleetNumber}</span>
        {vehicleType && (
          <span className="vehicle-type-badge">{vehicleType}</span>
        )}
      </div>

      {/* Context Details */}
      <div className="context-details">
        {/* Wizard Type */}
        <div className="context-row">
          <span className="context-icon">🔧</span>
          <span className="context-label">{wizardType || 'Assessment'}</span>
        </div>

        {/* Location */}
        {location?.name && (
          <div className="context-row">
            <span className="context-icon">📍</span>
            <span className="context-value location-value">{location.name}</span>
          </div>
        )}

        {/* Route */}
        {routeInfo?.route && (
          <div className="context-row">
            <span className="context-icon">🚌</span>
            <span className="context-value">
              Route {routeInfo.route}
              {routeInfo.routeName && ` - ${routeInfo.routeName}`}
            </span>
          </div>
        )}
      </div>

      {/* Quick Info Pills */}
      <div className="context-pills">
        {depot && (
          <span className="context-pill depot-pill">
            {depot}
          </span>
        )}
        {registration && (
          <span className="context-pill reg-pill">
            {registration}
          </span>
        )}
        {assessmentId && (
          <span className="context-pill id-pill" title={`Assessment ID: ${assessmentId}`}>
            #{assessmentId.slice(-6)}
          </span>
        )}
      </div>
    </div>
  );
};

export default WizardContextHeader;
