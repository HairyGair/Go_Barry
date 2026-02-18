import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { apiClient } from '../../services/api-client';

const DEPOTS = [
  { code: 'WAS', name: 'Washington' },
  { code: 'NCL', name: 'Riverside' },
  { code: 'CON', name: 'Consett' },
  { code: 'GTS', name: 'Deptford' },
  { code: 'HEX', name: 'Hexham' },
  { code: 'DAR', name: 'Percy Main' }
];

const SKILL_OPTIONS = [
  'Electrical', 'Mechanical', 'HVAC', 'Body', 'EV/Hybrid',
  'Diagnostics', 'Brakes', 'Transmission', 'Doors', 'Suspension'
];

const EngineerManagementPage = () => {
  const [activeTab, setActiveTab] = useState('engineers');
  const [engineers, setEngineers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showEngineerForm, setShowEngineerForm] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const fetchEngineers = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/engineer-management/engineers?include_all=true');
      if (res.success) setEngineers(res.engineers || []);
    } catch (err) {
      console.error('Error fetching engineers:', err);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/engineer-management/shift-templates');
      if (res.success) setTemplates(res.templates || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  }, []);

  const fetchRoster = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/engineer-management/on-shift');
      if (res.success) setRoster(res.engineers || []);
    } catch (err) {
      console.error('Error fetching roster:', err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchEngineers(), fetchTemplates(), fetchRoster()]);
      setLoading(false);
    };
    load();
  }, [fetchEngineers, fetchTemplates, fetchRoster]);

  const tabs = [
    { id: 'engineers', label: 'My Engineers', count: engineers.length },
    { id: 'templates', label: 'Shift Templates', count: templates.length },
    { id: 'roster', label: "Today's Roster", count: roster.length }
  ];

  return (
    <DashboardLayout title="Engineer Management" icon="wrench">
      {/* Header */}
      <div className="emp-header">
        <div className="emp-header-left">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <div>
            <h2>Engineer Management</h2>
            <p>Manage your engineers, shift patterns, and daily roster</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="emp-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`emp-tab ${activeTab === tab.id ? 'emp-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span className="emp-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="emp-loading">
          <div className="emp-spinner" />
          <p>Loading data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'engineers' && (
            <EngineersTab
              engineers={engineers}
              onRefresh={fetchEngineers}
              showForm={showEngineerForm}
              setShowForm={setShowEngineerForm}
              editing={editingEngineer}
              setEditing={setEditingEngineer}
            />
          )}
          {activeTab === 'templates' && (
            <TemplatesTab
              templates={templates}
              onRefresh={fetchTemplates}
              showForm={showTemplateForm}
              setShowForm={setShowTemplateForm}
              editing={editingTemplate}
              setEditing={setEditingTemplate}
            />
          )}
          {activeTab === 'roster' && (
            <RosterTab roster={roster} onRefresh={fetchRoster} />
          )}
        </>
      )}

      <style>{empStyles}</style>
    </DashboardLayout>
  );
};

// ─── Engineers Tab ────────────────────────────────────────────────────────────

const EngineersTab = ({ engineers, onRefresh, showForm, setShowForm, editing, setEditing }) => {
  const handleEdit = (eng) => {
    setEditing(eng);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this engineer?')) return;
    try {
      await apiClient.delete(`/api/engineer-management/engineers/${id}`);
      onRefresh();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  return (
    <div>
      <div className="emp-section-header">
        <h3>{engineers.length} Engineer{engineers.length !== 1 ? 's' : ''}</h3>
        <button className="emp-add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
          + Add Engineer
        </button>
      </div>

      {showForm && (
        <EngineerForm
          engineer={editing}
          onSave={() => { setShowForm(false); setEditing(null); onRefresh(); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="emp-card-grid">
        {engineers.map(eng => {
          const skills = Array.isArray(eng.skills) ? eng.skills : [];
          const depotName = DEPOTS.find(d => d.code === eng.home_depot_code)?.name || eng.home_depot_code || 'No depot';
          return (
            <div key={eng.id} className="emp-eng-card">
              <div className="emp-eng-card-top">
                <div>
                  <div className="emp-eng-name">{eng.name}</div>
                  <div className="emp-eng-badge">{eng.badge_number}</div>
                </div>
                <div className={`emp-eng-status emp-st-${eng.status}`}>
                  {eng.status || 'unknown'}
                </div>
              </div>
              <div className="emp-eng-detail">
                <span className="emp-eng-depot">{depotName}</span>
                {eng.phone && <span className="emp-eng-phone">{eng.phone}</span>}
              </div>
              {skills.length > 0 && (
                <div className="emp-eng-skills">
                  {skills.map((s, i) => (
                    <span key={i} className="emp-skill-pill">{s}</span>
                  ))}
                </div>
              )}
              <div className="emp-eng-actions">
                <button className="emp-action-btn" onClick={() => handleEdit(eng)}>Edit</button>
                <button className="emp-action-btn emp-action-del" onClick={() => handleDelete(eng.id)}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Engineer Form ───────────────────────────────────────────────────────────

const EngineerForm = ({ engineer, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: engineer?.name || '',
    badge_number: engineer?.badge_number || '',
    phone: engineer?.phone || '',
    email: engineer?.email || '',
    home_depot_code: engineer?.home_depot_code || '',
    skills: Array.isArray(engineer?.skills) ? engineer.skills : []
  });
  const [saving, setSaving] = useState(false);

  const toggleSkill = (skill) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.badge_number) return;
    setSaving(true);
    try {
      if (engineer) {
        await apiClient.put(`/api/engineer-management/engineers/${engineer.id}`, form);
      } else {
        await apiClient.post('/api/engineer-management/engineers', form);
      }
      onSave();
    } catch (err) {
      console.error('Error saving engineer:', err);
      alert('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="emp-form" onSubmit={handleSubmit}>
      <h4 className="emp-form-title">{engineer ? 'Edit Engineer' : 'Add New Engineer'}</h4>
      <div className="emp-form-grid">
        <div className="emp-form-group">
          <label>Name *</label>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        </div>
        <div className="emp-form-group">
          <label>Badge Number *</label>
          <input value={form.badge_number} onChange={e => setForm({...form, badge_number: e.target.value})} required />
        </div>
        <div className="emp-form-group">
          <label>Phone</label>
          <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
        </div>
        <div className="emp-form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        <div className="emp-form-group">
          <label>Home Depot</label>
          <select value={form.home_depot_code} onChange={e => setForm({...form, home_depot_code: e.target.value})}>
            <option value="">Select depot</option>
            {DEPOTS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
          </select>
        </div>
      </div>
      <div className="emp-form-group emp-form-skills">
        <label>Skills</label>
        <div className="emp-skill-options">
          {SKILL_OPTIONS.map(skill => (
            <button
              key={skill}
              type="button"
              className={`emp-skill-opt ${form.skills.includes(skill) ? 'emp-skill-on' : ''}`}
              onClick={() => toggleSkill(skill)}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>
      <div className="emp-form-actions">
        <button type="button" className="emp-action-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="emp-add-btn" disabled={saving}>
          {saving ? 'Saving...' : (engineer ? 'Update' : 'Add Engineer')}
        </button>
      </div>
    </form>
  );
};

// ─── Templates Tab ───────────────────────────────────────────────────────────

const TemplatesTab = ({ templates, onRefresh, showForm, setShowForm, editing, setEditing }) => {
  const handleDelete = async (id) => {
    if (!confirm('Delete this shift template?')) return;
    try {
      await apiClient.delete(`/api/engineer-management/shift-templates/${id}`);
      onRefresh();
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  return (
    <div>
      <div className="emp-section-header">
        <h3>{templates.length} Shift Template{templates.length !== 1 ? 's' : ''}</h3>
        <button className="emp-add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
          + Add Template
        </button>
      </div>

      {showForm && (
        <TemplateForm
          template={editing}
          onSave={() => { setShowForm(false); setEditing(null); onRefresh(); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="emp-template-list">
        {templates.map(tmpl => (
          <div key={tmpl.id} className="emp-template-card">
            <div className="emp-tmpl-left">
              <span className="emp-tmpl-name">{tmpl.name}</span>
              <span className="emp-tmpl-time">
                {tmpl.start_time?.slice(0,5)} - {tmpl.end_time?.slice(0,5)}
              </span>
              {tmpl.depot_code && (
                <span className="emp-tmpl-depot">
                  {DEPOTS.find(d => d.code === tmpl.depot_code)?.name || tmpl.depot_code}
                </span>
              )}
            </div>
            <div className="emp-tmpl-actions">
              <button className="emp-action-btn" onClick={() => { setEditing(tmpl); setShowForm(true); }}>Edit</button>
              <button className="emp-action-btn emp-action-del" onClick={() => handleDelete(tmpl.id)}>Delete</button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="emp-empty-state">
            <p>No shift templates yet. Create templates like "Early 06:00-14:00" or "Late 14:00-22:00".</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Template Form ───────────────────────────────────────────────────────────

const TemplateForm = ({ template, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: template?.name || '',
    start_time: template?.start_time?.slice(0,5) || '',
    end_time: template?.end_time?.slice(0,5) || '',
    depot_code: template?.depot_code || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.start_time || !form.end_time) return;
    setSaving(true);
    try {
      const data = {
        ...form,
        start_time: form.start_time + ':00',
        end_time: form.end_time + ':00',
        depot_code: form.depot_code || null
      };
      if (template) {
        await apiClient.put(`/api/engineer-management/shift-templates/${template.id}`, data);
      } else {
        await apiClient.post('/api/engineer-management/shift-templates', data);
      }
      onSave();
    } catch (err) {
      console.error('Error saving template:', err);
      alert('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="emp-form" onSubmit={handleSubmit}>
      <h4 className="emp-form-title">{template ? 'Edit Template' : 'Add Shift Template'}</h4>
      <div className="emp-form-grid">
        <div className="emp-form-group">
          <label>Name *</label>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Early Shift" required />
        </div>
        <div className="emp-form-group">
          <label>Start Time *</label>
          <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required />
        </div>
        <div className="emp-form-group">
          <label>End Time *</label>
          <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required />
        </div>
        <div className="emp-form-group">
          <label>Depot (optional)</label>
          <select value={form.depot_code} onChange={e => setForm({...form, depot_code: e.target.value})}>
            <option value="">All depots</option>
            {DEPOTS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
          </select>
        </div>
      </div>
      <div className="emp-form-actions">
        <button type="button" className="emp-action-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="emp-add-btn" disabled={saving}>
          {saving ? 'Saving...' : (template ? 'Update' : 'Create Template')}
        </button>
      </div>
    </form>
  );
};

// ─── Roster Tab ──────────────────────────────────────────────────────────────

const RosterTab = ({ roster, onRefresh }) => {
  // Group by depot
  const byDepot = roster.reduce((acc, eng) => {
    const depot = eng.shift_depot || eng.home_depot_code || 'Unknown';
    const name = DEPOTS.find(d => d.code === depot)?.name || depot;
    if (!acc[name]) acc[name] = [];
    acc[name].push(eng);
    return acc;
  }, {});

  return (
    <div>
      <div className="emp-section-header">
        <h3>{roster.length} Engineer{roster.length !== 1 ? 's' : ''} on Shift Today</h3>
        <button className="emp-action-btn" onClick={onRefresh}>Refresh</button>
      </div>

      {roster.length === 0 ? (
        <div className="emp-empty-state">
          <p>No engineers checked in today. Use the shift check-in on the Engineering Dashboard to set who's working.</p>
        </div>
      ) : (
        Object.entries(byDepot).map(([depotName, engs]) => (
          <div key={depotName} className="emp-roster-depot">
            <div className="emp-roster-depot-hdr">
              <span className="emp-roster-depot-name">{depotName}</span>
              <span className="emp-roster-depot-count">
                {engs.filter(e => e.is_available).length} available / {engs.length} on shift
              </span>
            </div>
            {engs.map(eng => {
              const skills = Array.isArray(eng.skills) ? eng.skills : [];
              return (
                <div key={eng.id} className="emp-roster-eng">
                  <div className="emp-roster-eng-left">
                    <span className="emp-roster-eng-name">{eng.name}</span>
                    <span className="emp-roster-eng-badge">{eng.badge_number}</span>
                  </div>
                  <div className="emp-roster-eng-mid">
                    {skills.slice(0,3).map((s,i) => (
                      <span key={i} className="emp-skill-pill">{s}</span>
                    ))}
                  </div>
                  <div className="emp-roster-eng-right">
                    <span className="emp-roster-time">
                      {eng.shift_start?.slice(0,5)} - {eng.shift_end?.slice(0,5)}
                    </span>
                    <span className={`emp-roster-status ${eng.is_available ? 'emp-r-avail' : 'emp-r-busy'}`}>
                      {eng.is_available ? 'Available' : `On Job (${eng.active_jobs})`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const empStyles = `
  .emp-header {
    background: linear-gradient(135deg, #0097A7 0%, #00838F 100%);
    padding: 20px 24px;
    border-radius: 12px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 20px rgba(0,151,167,0.25);
    border: 1px solid rgba(0,188,212,0.3);
  }

  .emp-header-left {
    display: flex; align-items: center; gap: 14px; color: white;
  }

  .emp-header-left h2 {
    margin: 0; font-size: 20px; font-weight: 700;
    font-family: 'Outfit', sans-serif;
  }

  .emp-header-left p {
    margin: 2px 0 0; color: rgba(255,255,255,0.7);
    font-size: 13px; font-family: 'Inter', sans-serif;
  }

  .emp-tabs {
    display: flex; gap: 4px;
    background: #141d2b;
    border-radius: 10px;
    padding: 4px;
    margin-bottom: 20px;
    border: 1px solid rgba(255,255,255,0.06);
  }

  .emp-tab {
    flex: 1;
    padding: 10px 16px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #94a3b8;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .emp-tab:hover { color: #e2e8f0; background: rgba(255,255,255,0.04); }

  .emp-tab-active {
    background: rgba(0,151,167,0.15) !important;
    color: #22d3ee !important;
  }

  .emp-tab-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    background: rgba(255,255,255,0.08);
    padding: 2px 6px;
    border-radius: 8px;
  }

  .emp-tab-active .emp-tab-count {
    background: rgba(0,151,167,0.25);
  }

  .emp-loading {
    text-align: center; padding: 60px 20px;
    color: #94a3b8; font-family: 'Inter', sans-serif;
  }

  .emp-spinner {
    width: 36px; height: 36px;
    border: 3px solid #1e293b; border-top-color: #0097A7;
    border-radius: 50%;
    animation: emp-spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }
  @keyframes emp-spin { to { transform: rotate(360deg); } }

  .emp-section-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px;
  }

  .emp-section-header h3 {
    font-size: 16px; font-weight: 600; color: #e2e8f0;
    font-family: 'Outfit', sans-serif; margin: 0;
  }

  .emp-add-btn {
    padding: 8px 16px;
    background: linear-gradient(135deg, #0097A7, #00838F);
    color: white; border: none; border-radius: 6px;
    font-family: 'Outfit', sans-serif;
    font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all 0.15s;
  }
  .emp-add-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #00ACC1, #0097A7);
    box-shadow: 0 4px 14px rgba(0,151,167,0.3);
  }
  .emp-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .emp-action-btn {
    padding: 6px 14px;
    background: rgba(255,255,255,0.06);
    color: #94a3b8; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px; font-size: 12px; font-weight: 600;
    font-family: 'Outfit', sans-serif;
    cursor: pointer; transition: all 0.15s;
  }
  .emp-action-btn:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }

  .emp-action-del { color: #f87171; border-color: rgba(239,68,68,0.2); }
  .emp-action-del:hover { background: rgba(239,68,68,0.1); color: #fca5a5; }

  .emp-empty-state {
    text-align: center; padding: 40px 20px; color: #64748b;
    font-size: 13px; font-family: 'Inter', sans-serif;
    background: rgba(255,255,255,0.02);
    border: 1px dashed rgba(255,255,255,0.08);
    border-radius: 10px;
  }

  /* Engineer cards */
  .emp-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }

  .emp-eng-card {
    background: #141d2b;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 14px;
    transition: border-color 0.15s;
  }
  .emp-eng-card:hover { border-color: rgba(255,255,255,0.12); }

  .emp-eng-card-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 8px;
  }

  .emp-eng-name {
    font-size: 15px; font-weight: 700; color: #e2e8f0;
    font-family: 'Outfit', sans-serif;
  }

  .emp-eng-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: #64748b;
  }

  .emp-eng-status {
    font-size: 9px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.5px; padding: 3px 8px; border-radius: 4px;
  }

  .emp-st-available { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.25); }
  .emp-st-on_job { background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.25); }
  .emp-st-off_duty { background: rgba(100,116,139,0.12); color: #94a3b8; border: 1px solid rgba(100,116,139,0.2); }

  .emp-eng-detail {
    display: flex; gap: 12px; margin-bottom: 8px;
    font-size: 12px; color: #94a3b8;
    font-family: 'Inter', sans-serif;
  }

  .emp-eng-depot { color: #a5b4fc; }

  .emp-eng-skills {
    display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 10px;
  }

  .emp-skill-pill {
    font-size: 9px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; padding: 2px 6px; border-radius: 3px;
    background: rgba(0,151,167,0.12); color: #22d3ee;
    border: 1px solid rgba(0,151,167,0.2);
  }

  .emp-eng-actions {
    display: flex; gap: 6px;
    border-top: 1px solid rgba(255,255,255,0.04);
    padding-top: 10px;
  }

  /* Form */
  .emp-form {
    background: #141d2b;
    border: 1px solid rgba(0,151,167,0.2);
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .emp-form-title {
    font-size: 14px; font-weight: 700; color: #22d3ee;
    font-family: 'Outfit', sans-serif;
    margin: 0 0 16px;
  }

  .emp-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 12px;
  }

  .emp-form-group {
    display: flex; flex-direction: column; gap: 4px;
  }

  .emp-form-group label {
    font-size: 11px; font-weight: 600; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.5px;
    font-family: 'Inter', sans-serif;
  }

  .emp-form-group input, .emp-form-group select {
    background: #0d1420;
    border: 1px solid rgba(255,255,255,0.1);
    color: #e2e8f0;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
  }

  .emp-form-group input:focus, .emp-form-group select:focus {
    outline: none;
    border-color: rgba(0,151,167,0.5);
  }

  .emp-form-skills {
    margin-bottom: 16px;
  }

  .emp-skill-options {
    display: flex; gap: 6px; flex-wrap: wrap;
  }

  .emp-skill-opt {
    padding: 5px 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #94a3b8;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Inter', sans-serif;
  }
  .emp-skill-opt:hover { border-color: rgba(0,151,167,0.3); color: #e2e8f0; }

  .emp-skill-on {
    background: rgba(0,151,167,0.15) !important;
    border-color: rgba(0,151,167,0.4) !important;
    color: #22d3ee !important;
  }

  .emp-form-actions {
    display: flex; gap: 8px; justify-content: flex-end;
  }

  /* Template list */
  .emp-template-list {
    display: flex; flex-direction: column; gap: 8px;
  }

  .emp-template-card {
    display: flex; justify-content: space-between; align-items: center;
    background: #141d2b;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    padding: 12px 16px;
  }

  .emp-tmpl-left {
    display: flex; align-items: center; gap: 14px;
  }

  .emp-tmpl-name {
    font-size: 14px; font-weight: 700; color: #e2e8f0;
    font-family: 'Outfit', sans-serif;
  }

  .emp-tmpl-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; color: #94a3b8;
    background: rgba(255,255,255,0.04);
    padding: 3px 8px; border-radius: 4px;
  }

  .emp-tmpl-depot {
    font-size: 11px; color: #a5b4fc;
    font-family: 'Inter', sans-serif;
  }

  .emp-tmpl-actions {
    display: flex; gap: 6px;
  }

  /* Roster */
  .emp-roster-depot {
    background: #141d2b;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    margin-bottom: 12px;
    overflow: hidden;
  }

  .emp-roster-depot-hdr {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 16px;
    background: rgba(0,151,167,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  .emp-roster-depot-name {
    font-size: 13px; font-weight: 700; color: #22d3ee;
    text-transform: uppercase; letter-spacing: 0.5px;
    font-family: 'Outfit', sans-serif;
  }

  .emp-roster-depot-count {
    font-size: 11px; color: #94a3b8;
    font-family: 'Inter', sans-serif;
  }

  .emp-roster-eng {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }
  .emp-roster-eng:last-child { border-bottom: none; }

  .emp-roster-eng-left {
    min-width: 140px;
  }

  .emp-roster-eng-name {
    font-size: 13px; font-weight: 600; color: #e2e8f0;
    font-family: 'Outfit', sans-serif;
    display: block;
  }

  .emp-roster-eng-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; color: #64748b;
  }

  .emp-roster-eng-mid {
    flex: 1;
    display: flex; gap: 4px; flex-wrap: wrap;
  }

  .emp-roster-eng-right {
    display: flex; align-items: center; gap: 10px;
  }

  .emp-roster-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: #64748b;
  }

  .emp-roster-status {
    font-size: 9px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.5px; padding: 3px 8px; border-radius: 4px;
  }

  .emp-r-avail {
    background: rgba(16,185,129,0.12); color: #34d399;
    border: 1px solid rgba(16,185,129,0.25);
  }

  .emp-r-busy {
    background: rgba(245,158,11,0.12); color: #fbbf24;
    border: 1px solid rgba(245,158,11,0.25);
  }
`;

export default EngineerManagementPage;
