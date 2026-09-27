/**
 * Engineer Management
 *
 * Three views over the same data:
 *  - Today:          who covers each depot across the day (timeline + gaps)
 *  - Engineers:      the full directory with live status and today's shift
 *  - Shift patterns: reusable shift times used at check-in
 *
 * Live status comes from the jobs list using the dispatch board's rules, so
 * both screens always agree on who is available.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Plus, LayoutGrid, CheckCircle2, Wrench, CalendarClock, UserMinus } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import ShiftCheckInModal from './ShiftCheckInModal';
import TodayRoster from './manage/TodayRoster';
import EngineersTable from './manage/EngineersTable';
import ShiftPatterns from './manage/ShiftPatterns';
import { EngineerFormModal, PatternFormModal } from './manage/ManageForms';
import { liveStatusFor } from './manage/manageHelpers';
import { apiClient } from '../../services/api-client';
import './manage/manage.css';

const REFRESH_MS = 30 * 1000;

const EngineerManagementPage = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [engineers, setEngineers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [roster, setRoster] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [notice, setNotice] = useState(null);

  const [engineerForm, setEngineerForm] = useState(null); // null | { engineer }
  const [patternForm, setPatternForm] = useState(null);   // null | { template }
  const [showCheckIn, setShowCheckIn] = useState(false);

  const flash = useCallback((text, tone = 'ok') => {
    setNotice({ text, tone, at: Date.now() });
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const loadAll = useCallback(async ({ quiet = false } = {}) => {
    const results = await Promise.allSettled([
      apiClient.get('/api/engineer-management/engineers?include_all=true'),
      apiClient.get('/api/engineer-management/shift-templates'),
      apiClient.get('/api/engineer-management/on-shift'),
      apiClient.get('/api/engineering/jobs?filter=all'),
    ]);
    const [eng, tmpl, onShift, jobRes] = results.map(r => (r.status === 'fulfilled' ? r.value : null));
    if (eng?.success) setEngineers(eng.engineers || []);
    if (tmpl?.success) setTemplates(tmpl.templates || []);
    if (onShift?.success) setRoster(onShift.engineers || []);
    if (jobRes) setJobs(jobRes.jobs || jobRes.data || []);
    const failed = results.some(r => r.status === 'rejected');
    if (!quiet) setLoadError(failed ? 'Some information couldn’t be loaded. Showing what we have.' : '');
    setNow(new Date());
  }, []);

  useEffect(() => {
    (async () => {
      await loadAll();
      setLoading(false);
    })();
    const poll = setInterval(() => loadAll({ quiet: true }), REFRESH_MS);
    const tick = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [loadAll]);

  const rosterById = useMemo(() => {
    const map = {};
    roster.forEach(r => { map[r.id] = r; });
    return map;
  }, [roster]);

  const stats = useMemo(() => {
    const statuses = engineers.map(e => liveStatusFor(e, rosterById[e.id], jobs).status);
    return {
      working: statuses.filter(s => ['available', 'en_route', 'on_site'].includes(s)).length,
      available: statuses.filter(s => s === 'available').length,
      busy: statuses.filter(s => s === 'en_route' || s === 'on_site').length,
      later: statuses.filter(s => s === 'upcoming').length,
      notRostered: statuses.filter(s => s === 'not_rostered').length,
    };
  }, [engineers, rosterById, jobs]);

  const handleDeactivate = async (eng) => {
    try {
      await apiClient.delete(`/api/engineer-management/engineers/${eng.id}`);
      flash(`${eng.name} deactivated`);
      loadAll({ quiet: true });
    } catch (err) {
      flash(err?.message || `Couldn’t deactivate ${eng.name}`, 'error');
    }
  };

  const handleEndShift = async (entry) => {
    try {
      await apiClient.post(`/api/engineer-management/daily-shifts/${entry.id}/end`, {});
      flash(`${entry.name} signed off for today`);
      loadAll({ quiet: true });
    } catch (err) {
      flash(err?.message || `Couldn’t sign ${entry.name} off`, 'error');
    }
  };

  const handleDeletePattern = async (tmpl) => {
    try {
      await apiClient.delete(`/api/engineer-management/shift-templates/${tmpl.id}`);
      flash(`${tmpl.name} deleted`);
      loadAll({ quiet: true });
    } catch (err) {
      flash(err?.message || `Couldn’t delete ${tmpl.name}`, 'error');
    }
  };

  const afterSave = (message) => {
    setEngineerForm(null);
    setPatternForm(null);
    flash(message);
    loadAll({ quiet: true });
  };

  const tabs = [
    { id: 'today', label: 'Today', count: roster.length },
    { id: 'engineers', label: 'Engineers', count: engineers.length },
    { id: 'patterns', label: 'Shift patterns', count: templates.length },
  ];

  const primaryAction = {
    today: { label: 'Check in engineers', icon: UserPlus, onClick: () => setShowCheckIn(true) },
    engineers: { label: 'Add engineer', icon: Plus, onClick: () => setEngineerForm({ engineer: null }) },
    patterns: { label: 'Add shift pattern', icon: Plus, onClick: () => setPatternForm({ template: null }) },
  }[activeTab];
  const PrimaryIcon = primaryAction.icon;

  return (
    <DashboardLayout title="Engineer Management" icon="wrench">
      <div className="emg-page">
        <header className="emg-header">
          <div className="emg-header-left">
            <div className="emg-header-icon"><Users size={20} aria-hidden="true" /></div>
            <div>
              <h2>Engineer Management</h2>
              <p>Rosters, cover and your engineering team</p>
            </div>
          </div>

          <div className="emg-kpis" role="list" aria-label="Engineer summary">
            <div className="emg-kpi" role="listitem">
              <Users size={13} aria-hidden="true" />
              <span className="emg-kpi-val">{stats.working}</span>
              <span className="emg-kpi-lbl">Working now</span>
            </div>
            <div className="emg-kpi emg-kpi-good" role="listitem">
              <CheckCircle2 size={13} aria-hidden="true" />
              <span className="emg-kpi-val">{stats.available}</span>
              <span className="emg-kpi-lbl">Available</span>
            </div>
            <div className="emg-kpi emg-kpi-warn" role="listitem">
              <Wrench size={13} aria-hidden="true" />
              <span className="emg-kpi-val">{stats.busy}</span>
              <span className="emg-kpi-lbl">On a job</span>
            </div>
            <div className="emg-kpi" role="listitem">
              <CalendarClock size={13} aria-hidden="true" />
              <span className="emg-kpi-val">{stats.later}</span>
              <span className="emg-kpi-lbl">Later today</span>
            </div>
            <div className="emg-kpi" role="listitem">
              <UserMinus size={13} aria-hidden="true" />
              <span className="emg-kpi-val">{stats.notRostered}</span>
              <span className="emg-kpi-lbl">Not rostered</span>
            </div>
          </div>

          <Link to="/dashboards/engineering" className="emg-btn">
            <LayoutGrid size={14} aria-hidden="true" /> Dispatch board
          </Link>
        </header>

        <div className="emg-tabbar">
          <div className="emg-tabs" role="tablist" aria-label="Engineer management views">
            {tabs.map(tab => (
              <button
                key={tab.id}
                id={`emg-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`emg-panel-${tab.id}`}
                className={`emg-tab ${activeTab === tab.id ? 'emg-tab-on' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span className="emg-tab-count">{tab.count}</span>
              </button>
            ))}
          </div>
          <button type="button" className="emg-btn emg-btn-primary" onClick={primaryAction.onClick}>
            <PrimaryIcon size={15} aria-hidden="true" /> {primaryAction.label}
          </button>
        </div>

        {loadError && <div className="emg-banner" role="status">{loadError}</div>}

        <section
          id={`emg-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`emg-tab-${activeTab}`}
          className="emg-panel"
        >
          {loading ? (
            <div className="emg-loading" aria-busy="true">
              <div className="emg-skel" /><div className="emg-skel" /><div className="emg-skel" />
            </div>
          ) : activeTab === 'today' ? (
            <TodayRoster
              roster={roster}
              jobs={jobs}
              now={now}
              onCheckIn={() => setShowCheckIn(true)}
              onEndShift={handleEndShift}
            />
          ) : activeTab === 'engineers' ? (
            <EngineersTable
              engineers={engineers}
              rosterById={rosterById}
              jobs={jobs}
              onEdit={(engineer) => setEngineerForm({ engineer })}
              onDeactivate={handleDeactivate}
            />
          ) : (
            <ShiftPatterns
              templates={templates}
              roster={roster}
              onAdd={() => setPatternForm({ template: null })}
              onEdit={(template) => setPatternForm({ template })}
              onDelete={handleDeletePattern}
            />
          )}
        </section>

        {notice && (
          <div key={notice.at} className={`emg-toast emg-toast-${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'}>
            {notice.text}
          </div>
        )}
      </div>

      {engineerForm && (
        <EngineerFormModal engineer={engineerForm.engineer} onClose={() => setEngineerForm(null)} onSaved={afterSave} />
      )}
      {patternForm && (
        <PatternFormModal template={patternForm.template} onClose={() => setPatternForm(null)} onSaved={afterSave} />
      )}
      {showCheckIn && (
        <ShiftCheckInModal
          onComplete={() => { setShowCheckIn(false); flash('Check-in saved'); loadAll({ quiet: true }); }}
          onSkip={() => setShowCheckIn(false)}
          dismissLabel="Cancel"
        />
      )}
    </DashboardLayout>
  );
};

export default EngineerManagementPage;
