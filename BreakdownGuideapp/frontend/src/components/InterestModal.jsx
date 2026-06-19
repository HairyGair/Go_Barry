/**
 * InterestModal - "I am interested" sales enquiry form for prospective operators.
 *
 * Shown from the public landing page. Collects the qualifying details we need to
 * understand an operator's company, then POSTs to /api/public/interest which emails
 * the enquiry through. No authentication required.
 */

import React, { useState } from 'react';
import AccessibleModal from './AccessibleModal.jsx';
import './InterestModal.css';

const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

const FLEET_SIZES = [
  '1–20 vehicles',
  '21–50 vehicles',
  '51–150 vehicles',
  '151–500 vehicles',
  '500+ vehicles',
];

const CURRENT_PROCESS = [
  'Paper logs',
  'Spreadsheets',
  'Phone / radio only',
  'Another software system',
  'A mix of the above',
  'Other',
];

const FEATURES = [
  'Guided diagnostic wizards',
  'Engineering dispatch & live ETA',
  'Replacement vehicle / dead-mileage (BSOG)',
  'Live route status',
  'Depot wall displays',
  'Analytics & reporting',
];

export default function InterestModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', role: '',
    fleetSize: '', depots: '', currentProcess: '', message: '',
    website: '', // honeypot
  });
  const [features, setFeatures] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleFeature = (feature) => {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  const handleClose = () => {
    if (status === 'submitting') return;
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'submitting') return;

    if (!form.name.trim() || !form.company.trim() || !form.email.trim()) {
      setStatus('error');
      setErrorMsg('Please fill in your name, company, and email.');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch(`${apiUrl}/api/public/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, features }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Could not reach the server. Please try again, or email gair@gobarry.co.uk directly.');
    }
  };

  if (!isOpen) return null;

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleClose}
      labelId="im-title"
      descriptionId="im-desc"
      overlayClassName="im-overlay"
      containerClassName="im-container"
      closeOnOverlay={status !== 'submitting'}
    >
      <button className="im-close" onClick={handleClose} aria-label="Close" type="button">×</button>

      {status === 'success' ? (
        <div className="im-success">
          <div className="im-success-icon" aria-hidden="true">✓</div>
          <h2 id="im-title">Thank you</h2>
          <p>
            Your enquiry has been sent. We'll be in touch with you shortly to talk through how
            Go BARRY can work for your operation.
          </p>
          <button className="im-submit" type="button" onClick={handleClose}>Done</button>
        </div>
      ) : (
        <form className="im-form" onSubmit={handleSubmit} noValidate>
          <div className="im-header">
            <h2 id="im-title">Tell us about your operation</h2>
            <p id="im-desc">
              Go BARRY is tailored to each operator. Share a few details and we'll get back to you
              about how it could fit your fleet. Fields marked * are required.
            </p>
          </div>

          <div className="im-grid">
            <div className="im-field">
              <label htmlFor="im-name">Your name *</label>
              <input id="im-name" type="text" value={form.name} onChange={update('name')} required autoComplete="name" />
            </div>
            <div className="im-field">
              <label htmlFor="im-company">Company / operator *</label>
              <input id="im-company" type="text" value={form.company} onChange={update('company')} required autoComplete="organization" />
            </div>
            <div className="im-field">
              <label htmlFor="im-email">Email *</label>
              <input id="im-email" type="email" value={form.email} onChange={update('email')} required autoComplete="email" />
            </div>
            <div className="im-field">
              <label htmlFor="im-phone">Phone</label>
              <input id="im-phone" type="tel" value={form.phone} onChange={update('phone')} autoComplete="tel" />
            </div>
            <div className="im-field">
              <label htmlFor="im-role">Your role</label>
              <input id="im-role" type="text" value={form.role} onChange={update('role')} placeholder="e.g. Operations Manager" />
            </div>
            <div className="im-field">
              <label htmlFor="im-fleet">Fleet size</label>
              <select id="im-fleet" value={form.fleetSize} onChange={update('fleetSize')}>
                <option value="">Select…</option>
                {FLEET_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="im-field">
              <label htmlFor="im-depots">Number of depots / sites</label>
              <input id="im-depots" type="text" value={form.depots} onChange={update('depots')} placeholder="e.g. 4" />
            </div>
            <div className="im-field">
              <label htmlFor="im-process">How do you manage breakdowns now?</label>
              <select id="im-process" value={form.currentProcess} onChange={update('currentProcess')}>
                <option value="">Select…</option>
                {CURRENT_PROCESS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <fieldset className="im-fieldset">
            <legend>Which features interest you most?</legend>
            <div className="im-checkboxes">
              {FEATURES.map((feature) => (
                <label key={feature} className="im-checkbox">
                  <input
                    type="checkbox"
                    checked={features.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                  />
                  <span>{feature}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="im-field">
            <label htmlFor="im-message">Anything else you'd like us to know?</label>
            <textarea id="im-message" rows={3} value={form.message} onChange={update('message')} />
          </div>

          {/* Honeypot - hidden from real users, catches bots */}
          <div className="im-honeypot" aria-hidden="true">
            <label htmlFor="im-website">Website</label>
            <input id="im-website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={update('website')} />
          </div>

          {status === 'error' && (
            <div className="im-error" role="alert">{errorMsg}</div>
          )}

          <div className="im-actions">
            <button type="button" className="im-cancel" onClick={handleClose} disabled={status === 'submitting'}>
              Cancel
            </button>
            <button type="submit" className="im-submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : 'Send enquiry'}
            </button>
          </div>
        </form>
      )}
    </AccessibleModal>
  );
}
