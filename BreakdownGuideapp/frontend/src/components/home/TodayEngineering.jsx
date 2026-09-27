/**
 * TodayEngineering - engineering & recovery activity for today: engineers
 * dispatched/on site, arrival vs ETA accuracy, replacement vehicles sent and
 * dead mileage lost.
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

import React from 'react';
import { Wrench, MapPinCheck, Bus, Route } from 'lucide-react';

const StatBlock = ({ icon: Icon, label, value, unit, sub }) => (
  <div className="ts-stat">
    <Icon size={16} className="ts-stat-icon" />
    <div className="ts-stat-body">
      <span className="ts-stat-value">
        {value == null ? <span className="ts-stat-empty">&mdash;</span> : <>{value}{unit && <small>{unit}</small>}</>}
      </span>
      <span className="ts-stat-label">{label}</span>
      {sub && <span className="ts-stat-sub">{sub}</span>}
    </div>
  </div>
);

const TodayEngineering = ({ engineering }) => {
  const e = engineering || {};
  const hasActivity = (e.dispatched || 0) > 0 || (e.replacementsSent || 0) > 0;

  let arrivalSub = null;
  if (e.avgArrivalMinutes != null && e.avgEtaMinutes != null) {
    const diff = e.avgArrivalMinutes - e.avgEtaMinutes;
    if (Math.abs(diff) <= 2) arrivalSub = 'on target vs ETA';
    else if (diff < 0) arrivalSub = `${Math.abs(diff)}m ahead of ETA`;
    else arrivalSub = `${diff}m behind ETA`;
  } else if (e.avgEtaMinutes != null) {
    arrivalSub = `ETA avg ${e.avgEtaMinutes}m`;
  }

  return (
    <div className="hp-card ts-card ts-card--wide">
      <div className="hp-card-header">
        <Wrench size={14} />
        <h3 className="hp-card-title">Engineering &amp; recovery today</h3>
      </div>

      <div className="ts-card-body">
        {!hasActivity ? (
          <div className="ts-mini-empty">
            <p>No dispatches yet today</p>
            <span>Engineer and replacement-vehicle activity will show here.</span>
          </div>
        ) : (
          <div className="ts-stat-grid">
            <StatBlock icon={Wrench} label="Engineers dispatched" value={e.dispatched ?? 0} />
            <StatBlock icon={MapPinCheck} label="On site" value={e.onSite ?? 0} />
            <StatBlock
              icon={Route}
              label="Avg arrival"
              value={e.avgArrivalMinutes}
              unit="m"
              sub={arrivalSub}
            />
            <StatBlock icon={Bus} label="Replacements sent" value={e.replacementsSent ?? 0} />
            <StatBlock
              icon={Route}
              label="Dead mileage"
              value={e.mileageLost != null ? e.mileageLost.toFixed(1) : null}
              unit="mi"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayEngineering;
