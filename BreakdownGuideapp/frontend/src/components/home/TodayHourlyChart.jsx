/**
 * TodayHourlyChart - the Home page's "how is today going" hero visual.
 *
 * Hourly breakdown counts for today, stacked by severity, with a "now"
 * marker and the four standard duty windows shown as a subtle strip beneath
 * the bars so a supervisor can see at a glance which duty was on when things
 * happened. Hand-rolled with CSS (not recharts) so the duty windows - which
 * fall on half-hour boundaries, not the hourly buckets the data comes in -
 * can be positioned exactly as a continuous 24h timeline rather than being
 * forced onto the bar categories.
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

import React, { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';

// Duty windows as fractional hours (0-24) on today's timeline. Duty 500 runs
// past midnight (14:45-00:15) - only the portion that falls within today is
// drawn; the sliver after midnight belongs to "yesterday's" chart, not this one.
const DUTY_WINDOWS = [
  { code: '100', start: 6, end: 15.5 },
  { code: '200', start: 7.5, end: 17 },
  { code: '400', start: 12.5, end: 22 },
  { code: '500', start: 14.75, end: 24 }
];

const pct = (v) => `${Math.max(0, Math.min(100, v))}%`;

const TodayHourlyChart = ({ hourly, currentTime }) => {
  const [hoverHour, setHoverHour] = useState(null);

  const maxTotal = useMemo(() => {
    if (!hourly || hourly.length === 0) return 0;
    return hourly.reduce((max, h) => Math.max(max, h.stop + h.amber + h.cont + h.other), 0);
  }, [hourly]);

  const totalToday = useMemo(() => {
    if (!hourly) return 0;
    return hourly.reduce((sum, h) => sum + h.stop + h.amber + h.cont + h.other, 0);
  }, [hourly]);

  const nowPct = useMemo(() => {
    const t = currentTime || new Date();
    return ((t.getHours() * 60 + t.getMinutes()) / (24 * 60)) * 100;
  }, [currentTime]);

  const hasData = maxTotal > 0;

  return (
    <div className="hp-card ts-hero-card">
      <div className="hp-card-header">
        <Activity size={14} />
        <h3 className="hp-card-title">Breakdowns through the day</h3>
        <span className="hp-card-count">{totalToday} today</span>
      </div>

      <div className="ts-hero-body">
        {!hasData ? (
          <div className="ts-hero-empty">
            <Activity size={26} strokeWidth={1.5} />
            <p>Nothing reported yet today</p>
            <span>Bars will fill in here as breakdowns come through.</span>
          </div>
        ) : (
          <>
            <div className="ts-hero-chart">
              <div className="ts-hero-now-line" style={{ left: pct(nowPct) }}>
                <span className="ts-hero-now-label">Now</span>
              </div>

              {hourly.map((h) => {
                const total = h.stop + h.amber + h.cont + h.other;
                const heightPct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                const isHovered = hoverHour === h.hour;
                return (
                  <div
                    key={h.hour}
                    className={`ts-hero-col ${isHovered ? 'ts-hero-col--active' : ''}`}
                    onMouseEnter={() => setHoverHour(h.hour)}
                    onMouseLeave={() => setHoverHour((cur) => (cur === h.hour ? null : cur))}
                  >
                    {isHovered && (
                      <div className="ts-hero-tooltip">
                        <strong>{String(h.hour).padStart(2, '0')}:00–{String((h.hour + 1) % 24).padStart(2, '0')}:00</strong>
                        {total === 0 ? (
                          <span className="ts-hero-tooltip-empty">No breakdowns</span>
                        ) : (
                          <div className="ts-hero-tooltip-rows">
                            {h.stop > 0 && <span><i className="ts-dot ts-dot--stop" />STOP {h.stop}</span>}
                            {h.amber > 0 && <span><i className="ts-dot ts-dot--amber" />AMBER {h.amber}</span>}
                            {h.cont > 0 && <span><i className="ts-dot ts-dot--cont" />CONTINUE {h.cont}</span>}
                            {h.other > 0 && <span><i className="ts-dot ts-dot--other" />Other {h.other}</span>}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="ts-hero-bar-track">
                      {total > 0 && (
                        <div className="ts-hero-bar" style={{ height: pct(heightPct) }}>
                          {/* column-reverse: first child sits at the bottom */}
                          {h.cont > 0 && <div className="ts-hero-seg ts-hero-seg--cont" style={{ flexGrow: h.cont }} />}
                          {h.amber > 0 && <div className="ts-hero-seg ts-hero-seg--amber" style={{ flexGrow: h.amber }} />}
                          {h.stop > 0 && <div className="ts-hero-seg ts-hero-seg--stop" style={{ flexGrow: h.stop }} />}
                          {h.other > 0 && <div className="ts-hero-seg ts-hero-seg--other" style={{ flexGrow: h.other }} />}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="ts-hero-axis">
              {hourly.map((h) => (
                <span key={h.hour} className="ts-hero-axis-tick">
                  {h.hour % 3 === 0 ? `${String(h.hour).padStart(2, '0')}:00` : ''}
                </span>
              ))}
            </div>

            <div className="ts-duty-strip">
              {DUTY_WINDOWS.map((d) => (
                <div className="ts-duty-row" key={d.code}>
                  <span className="ts-duty-label">{d.code}</span>
                  <div className="ts-duty-track">
                    <div
                      className="ts-duty-bar"
                      style={{ left: pct((d.start / 24) * 100), width: pct(((d.end - d.start) / 24) * 100) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TodayHourlyChart;
