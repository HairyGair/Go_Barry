/**
 * Engineer Management — add/edit dialogs for engineers and shift patterns
 *
 * Errors are shown inside the dialog (the old inline forms used alert()).
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import AccessibleModal from '../../../components/AccessibleModal';
import { apiClient } from '../../../services/api-client';
import { getDepots, SKILL_OPTIONS, hhmm, shiftHours } from './manageHelpers';

const errorText = (err) => {
  const msg = err?.message || '';
  if (!msg || /^(Server error|HTTP error)/.test(msg)) return 'The server couldn’t save this. Please try again.';
  return msg;
};

const DialogShell = ({ titleId, title, onClose, children }) => (
  <AccessibleModal
    isOpen
    onClose={onClose}
    labelId={titleId}
    overlayClassName="emg-modal-overlay"
    containerClassName="emg-modal"
  >
    <div className="emg-modal-head">
      <h2 id={titleId}>{title}</h2>
      <button type="button" className="emg-icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
    </div>
    {children}
  </AccessibleModal>
);

export const EngineerFormModal = ({ engineer, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: engineer?.name || '',
    badge_number: engineer?.badge_number || '',
    phone: engineer?.phone || '',
    email: engineer?.email || '',
    home_depot_code: engineer?.home_depot_code || '',
    skills: Array.isArray(engineer?.skills) ? engineer.skills : [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleSkill = (skill) => setForm(f => ({
    ...f,
    skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill],
  }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.badge_number.trim() || !form.home_depot_code) {
      setError('Name, badge number and home depot are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, name: form.name.trim(), badge_number: form.badge_number.trim() };
      if (engineer) await apiClient.put(`/api/engineer-management/engineers/${engineer.id}`, payload);
      else await apiClient.post('/api/engineer-management/engineers', payload);
      onSaved(engineer ? `${payload.name} updated` : `${payload.name} added`);
    } catch (err) {
      setError(errorText(err));
      setSaving(false);
    }
  };

  return (
    <DialogShell titleId="emg-eng-title" title={engineer ? `Edit ${engineer.name}` : 'Add engineer'} onClose={onClose}>
      <form onSubmit={submit} className="emg-form" noValidate>
        <div className="emg-form-grid">
          <label className="emg-field">
            <span>Name</span>
            <input value={form.name} onChange={set('name')} autoComplete="off" required />
          </label>
          <label className="emg-field">
            <span>Badge number</span>
            <input value={form.badge_number} onChange={set('badge_number')} autoComplete="off" required maxLength={20} />
          </label>
          <label className="emg-field">
            <span>Home depot</span>
            <select value={form.home_depot_code} onChange={set('home_depot_code')} required>
              <option value="">Select depot</option>
              {getDepots().map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>
          </label>
          <label className="emg-field">
            <span>Phone <em>optional</em></span>
            <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="off" />
          </label>
          <label className="emg-field emg-field-wide">
            <span>Email <em>optional</em></span>
            <input type="email" value={form.email} onChange={set('email')} autoComplete="off" />
          </label>
        </div>

        <fieldset className="emg-field emg-field-wide emg-skillset">
          <legend>Skills</legend>
          <div className="emg-skill-picker">
            {SKILL_OPTIONS.map(skill => (
              <button
                key={skill}
                type="button"
                aria-pressed={form.skills.includes(skill)}
                className={`emg-chip ${form.skills.includes(skill) ? 'emg-chip-on' : ''}`}
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
          <p className="emg-hint">Skills are used to suggest the best engineer for each breakdown.</p>
        </fieldset>

        {error && <div className="emg-form-error" role="alert">{error}</div>}

        <div className="emg-modal-foot">
          <button type="button" className="emg-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="emg-btn emg-btn-primary" disabled={saving}>
            {saving ? 'Saving…' : engineer ? 'Save changes' : 'Add engineer'}
          </button>
        </div>
      </form>
    </DialogShell>
  );
};

export const PatternFormModal = ({ template, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: template?.name || '',
    start_time: hhmm(template?.start_time),
    end_time: hhmm(template?.end_time),
    depot_code: template?.depot_code || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const hours = shiftHours(form.start_time, form.end_time);
  const overnight = form.start_time && form.end_time && form.end_time <= form.start_time;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.start_time || !form.end_time) {
      setError('Name, start and end time are required.');
      return;
    }
    if (form.start_time === form.end_time) {
      setError('Start and end time can’t be the same.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        start_time: `${form.start_time}:00`,
        end_time: `${form.end_time}:00`,
        depot_code: form.depot_code || null,
      };
      if (template) await apiClient.put(`/api/engineer-management/shift-templates/${template.id}`, payload);
      else await apiClient.post('/api/engineer-management/shift-templates', payload);
      onSaved(template ? `${payload.name} updated` : `${payload.name} added`);
    } catch (err) {
      setError(errorText(err));
      setSaving(false);
    }
  };

  return (
    <DialogShell titleId="emg-pat-title" title={template ? `Edit ${template.name}` : 'Add shift pattern'} onClose={onClose}>
      <form onSubmit={submit} className="emg-form" noValidate>
        <div className="emg-form-grid">
          <label className="emg-field emg-field-wide">
            <span>Name</span>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Early" autoComplete="off" required />
          </label>
          <label className="emg-field">
            <span>Starts</span>
            <input type="time" value={form.start_time} onChange={set('start_time')} required />
          </label>
          <label className="emg-field">
            <span>Ends</span>
            <input type="time" value={form.end_time} onChange={set('end_time')} required />
          </label>
          <label className="emg-field emg-field-wide">
            <span>Depot <em>optional</em></span>
            <select value={form.depot_code} onChange={set('depot_code')}>
              <option value="">All depots</option>
              {getDepots().map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>
          </label>
        </div>
        {hours !== null && form.start_time !== form.end_time && (
          <p className="emg-hint">{hours} hour shift{overnight ? ', runs past midnight' : ''}.</p>
        )}

        {error && <div className="emg-form-error" role="alert">{error}</div>}

        <div className="emg-modal-foot">
          <button type="button" className="emg-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="emg-btn emg-btn-primary" disabled={saving}>
            {saving ? 'Saving…' : template ? 'Save changes' : 'Add pattern'}
          </button>
        </div>
      </form>
    </DialogShell>
  );
};
