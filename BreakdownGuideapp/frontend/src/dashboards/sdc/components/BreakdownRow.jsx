/**
 * BreakdownRow - compact, scannable, selectable row for the Operations
 * command centre's centre column. Replaces the old "click to expand in
 * place" card header; selection now drives the right-hand detail drawer.
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

import React from 'react';
import { OctagonAlert, AlertTriangle, CheckCircle2, HelpCircle, MapPin, Wrench } from 'lucide-react';
import EngineerEtaCountdown from '../../../components/EngineerEtaCountdown';
import {
  getFleetNumber,
  getSimplifiedVehicleType,
  getVehicleType,
  getDepot,
  getIssueType,
  getDecisionInfo,
  getStatusLabel,
  getLocationSummary,
  formatElapsed
} from '../utils/breakdownRowHelpers';

const DECISION_ICONS = {
  stop: OctagonAlert,
  amber: AlertTriangle,
  continue: CheckCircle2,
  pending: HelpCircle
};

const BreakdownRow = ({ breakdown, isSelected = false, onSelect, rowRef }) => {
  const fleetNumber = getFleetNumber(breakdown);
  const vehicleType = getSimplifiedVehicleType(getVehicleType(breakdown));
  const depot = getDepot(breakdown);
  const issueType = getIssueType(breakdown);
  const location = getLocationSummary(breakdown);
  const statusLabel = getStatusLabel(breakdown);
  const decisionInfo = getDecisionInfo(breakdown);
  const DecisionIcon = DECISION_ICONS[decisionInfo.key] || HelpCircle;
  const elapsed = formatElapsed(breakdown.elapsed);
  const showEta = breakdown.engineer_dispatched_at && breakdown.engineer_eta_minutes && !breakdown.engineer_on_site_at;
  const isReplacementDispatched = breakdown.replacement_vehicle && breakdown.replacement_vehicle.status === 'dispatched';

  return (
    <div
      ref={rowRef}
      className={`br-row br-row-${decisionInfo.key} ${isSelected ? 'br-row-selected' : ''} ${breakdown.isFadingOut ? 'br-row-fading' : ''}`}
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}
      data-breakdown-id={breakdown.breakdown_id}
      onClick={() => onSelect(breakdown.breakdown_id)}
    >
      <div className="br-row-top">
        <span className="br-fleet">{fleetNumber}</span>
        {vehicleType && <span className="br-vehicle-type">{vehicleType}</span>}
        {breakdown.route_id && <span className="br-route-chip">Route {breakdown.route_id}</span>}
        <span className={`br-decision-chip br-decision-${decisionInfo.key}`}>
          <DecisionIcon size={11} aria-hidden="true" />
          {decisionInfo.text}
        </span>
        <span className="br-spacer" />
        {showEta && (
          <EngineerEtaCountdown
            dispatchedAt={breakdown.engineer_dispatched_at}
            etaMinutes={breakdown.engineer_eta_minutes}
            onSite={!!breakdown.engineer_on_site_at}
            compact
          />
        )}
        <span className="br-elapsed">{elapsed}</span>
      </div>

      <div className="br-row-mid">
        <span className="br-issue">{issueType}</span>
        <span className="br-sep" aria-hidden="true">&middot;</span>
        <span className="br-location">
          <MapPin size={11} className="br-location-icon" aria-hidden="true" />
          <span className="br-location-text">{location}</span>
        </span>
      </div>

      <div className="br-row-meta">
        <span className="br-status">{statusLabel}</span>
        <span className="br-sep" aria-hidden="true">&middot;</span>
        <span className="br-depot">{depot}</span>
        {isReplacementDispatched && (
          <>
            <span className="br-sep" aria-hidden="true">&middot;</span>
            <span className="br-replacement-badge">
              <Wrench size={10} aria-hidden="true" /> Replacement en route
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default BreakdownRow;
