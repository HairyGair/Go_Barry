/**
 * Diversions — printable driver sheet
 *
 * A plain black-on-white sheet for drivers: when it applies, where to leave the
 * route, turn-by-turn directions, where to rejoin, stops not served and any
 * stops on the diversion. Printing hides the rest of the app.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React from 'react';
import { Printer, X } from 'lucide-react';
import AccessibleModal from '../../../components/AccessibleModal';
import { reasonLabel, fmtDateTime, fmtDistance, uniqueStopNames } from './diversionsApi';

const DriverSheet = ({ diversion: d, onClose }) => (
  <AccessibleModal
    isOpen
    onClose={onClose}
    labelId="dvs-sheet-title"
    overlayClassName="dvs-sheet-overlay"
    containerClassName="dvs-sheet-shell"
  >
    <div className="dvs-sheet-bar">
      <span>Driver sheet</span>
      <div>
        <button type="button" className="dvs-btn dvs-btn-primary" onClick={() => window.print()}>
          <Printer size={14} aria-hidden="true" /> Print
        </button>
        <button type="button" className="dvs-icon-btn" onClick={onClose} aria-label="Close driver sheet"><X size={16} /></button>
      </div>
    </div>

    <article className="dvs-sheet">
      <header className="dvs-sheet-head">
        <div className="dvs-sheet-route">{d.routeShortName}</div>
        <div>
          <p className="dvs-sheet-kicker">Diversion · {reasonLabel(d.reason)}</p>
          <h1 id="dvs-sheet-title">{d.title}</h1>
          {d.directionLabel && <p>Towards {d.directionLabel}</p>}
        </div>
      </header>

      <table className="dvs-sheet-facts">
        <tbody>
          <tr><th>In force from</th><td>{fmtDateTime(d.startAt)}</td></tr>
          <tr><th>Until</th><td>{d.endAt ? fmtDateTime(d.endAt) : 'Further notice'}</td></tr>
          {d.closureDescription && <tr><th>Road closed</th><td>{d.closureDescription}</td></tr>}
          {(d.extraMiles != null || d.extraMinutes != null) && (
            <tr>
              <th>Extra</th>
              <td>
                {d.extraMiles != null ? `${d.extraMiles} miles` : ''}
                {d.extraMiles != null && d.extraMinutes != null ? ' · ' : ''}
                {d.extraMinutes != null ? `about ${d.extraMinutes} minute${Math.abs(d.extraMinutes) === 1 ? '' : 's'}` : ''}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <section>
        <h2>Route</h2>
        <p className="dvs-sheet-key"><strong>Leave the normal route after {d.from.name}.</strong></p>
        <ol className="dvs-sheet-steps">
          {(d.directions || []).map((s, i) => (
            <li key={i}>
              {s.instruction}
              {s.distanceMeters ? <span className="dvs-sheet-dist"> ({fmtDistance(s.distanceMeters)})</span> : null}
            </li>
          ))}
        </ol>
        <p className="dvs-sheet-key"><strong>Rejoin the normal route at {d.to.name}.</strong></p>
      </section>

      <div className="dvs-sheet-cols">
        <section>
          <h2>Stops not served</h2>
          {d.missedStops?.length ? <ul>{uniqueStopNames(d.missedStops).map(n => <li key={n}>{n}</li>)}</ul> : <p>None.</p>}
        </section>
        <section>
          <h2>Stops on the diversion</h2>
          {d.servedStops?.length ? <ul>{uniqueStopNames(d.servedStops).map(n => <li key={n}>{n}</li>)}</ul> : <p>None.</p>}
        </section>
      </div>

      {d.notes && (
        <section>
          <h2>Notes</h2>
          <p className="dvs-sheet-notes">{d.notes}</p>
        </section>
      )}

      <p className="dvs-sheet-check">Route checked for bus suitability by the issuing supervisor. Report any problem on the route to control straight away.</p>

      <footer className="dvs-sheet-foot">
        Issued {fmtDateTime(new Date())}{d.createdByName ? ` · Set up by ${d.createdByName}` : ''}
      </footer>
    </article>
  </AccessibleModal>
);

export default DriverSheet;
