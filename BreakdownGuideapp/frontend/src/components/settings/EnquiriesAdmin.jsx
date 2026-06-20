/**
 * EnquiriesAdmin - admin view of "I'm Interested" enquiries captured from the
 * public site. Durable backstop to the notification emails: every enquiry is
 * persisted and reviewable here. Admin-only (rendered inside AdminSettings).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/api-client.js';

const STATUS_LABELS = { new: 'New', contacted: 'Contacted', archived: 'Archived' };
const FILTERS = [['all', 'All'], ['new', 'New'], ['contacted', 'Contacted'], ['archived', 'Archived']];

const fmtDate = (d) => {
  try { return new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return d; }
};

export default function EnquiriesAdmin() {
  const [enquiries, setEnquiries] = useState([]);
  const [counts, setCounts] = useState({ new: 0, contacted: 0, archived: 0, total: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const q = filter === 'all' ? '' : `?status=${filter}`;
      const data = await apiClient.get(`/api/admin/enquiries${q}`);
      setEnquiries(data?.enquiries || []);
      if (data?.counts) setCounts(data.counts);
    } catch (err) {
      console.error('Failed to load enquiries:', err);
      setError('Failed to load enquiries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    try {
      await apiClient.patch(`/api/admin/enquiries/${id}`, { status });
      load();
    } catch (err) {
      console.error('Failed to update enquiry:', err);
      setError('Failed to update enquiry status.');
    }
  };

  const card = (e) => (
    <div key={e.id} style={{
      background: 'var(--bg-tertiary, #1e293b)', border: '1px solid rgba(0,151,167,0.2)',
      borderRadius: 10, padding: '16px 18px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary,#fff)' }}>
            {e.company} <span style={{ color: '#64748b', fontWeight: 400 }}>· {e.name}</span>
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
            <a href={`mailto:${e.email}`} style={{ color: '#00BCD4' }}>{e.email}</a>
            {e.phone ? ` · ${e.phone}` : ''}{e.role ? ` · ${e.role}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: e.status === 'new' ? 'rgba(0,188,212,0.18)' : e.status === 'contacted' ? 'rgba(16,185,129,0.18)' : 'rgba(148,163,184,0.15)',
            color: e.status === 'new' ? '#00BCD4' : e.status === 'contacted' ? '#10B981' : '#94a3b8',
          }}>{STATUS_LABELS[e.status] || e.status}</span>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{fmtDate(e.created_at)}</div>
          {!e.email_sent && <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 2 }}>⚠ email not sent</div>}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: 13, color: '#cbd5e1', marginTop: 10 }}>
        {e.fleet_size && <span><strong style={{ color: '#94a3b8' }}>Fleet:</strong> {e.fleet_size}</span>}
        {e.depots && <span><strong style={{ color: '#94a3b8' }}>Depots:</strong> {e.depots}</span>}
        {e.current_process && <span><strong style={{ color: '#94a3b8' }}>Now uses:</strong> {e.current_process}</span>}
      </div>
      {Array.isArray(e.features) && e.features.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {e.features.map((f, i) => (
            <span key={i} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 6, background: 'rgba(0,151,167,0.12)', color: '#67e8f9' }}>{f}</span>
          ))}
        </div>
      )}
      {e.message && (
        <div style={{ marginTop: 10, padding: '10px 12px', background: '#0b1220', borderLeft: '3px solid #0097A7', borderRadius: 6, fontSize: 13.5, color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
          {e.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {e.status !== 'contacted' && <button onClick={() => setStatus(e.id, 'contacted')} style={btn('#10B981')}>Mark Contacted</button>}
        {e.status !== 'archived' && <button onClick={() => setStatus(e.id, 'archived')} style={btn('#64748b')}>Archive</button>}
        {e.status !== 'new' && <button onClick={() => setStatus(e.id, 'new')} style={btn('#00BCD4')}>Reopen</button>}
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontSize: 18, margin: 0, color: 'var(--text-primary,#fff)' }}>
          Enquiries <span style={{ color: '#64748b', fontWeight: 400, fontSize: 14 }}>({counts.total} total)</span>
        </h3>
        <button onClick={load} style={btn('#0097A7')}>↻ Refresh</button>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '14px 0' }}>
        {FILTERS.map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(148,163,184,0.25)', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            background: filter === key ? '#0097A7' : 'transparent',
            color: filter === key ? '#fff' : '#94a3b8',
          }}>
            {label}{key !== 'all' && counts[key] ? ` (${counts[key]})` : ''}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#94a3b8' }}>Loading enquiries…</p>}
      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {!loading && !error && enquiries.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          No enquiries yet. They’ll appear here when prospects use the “I’m Interested” form.
        </div>
      )}
      {!loading && !error && enquiries.map(card)}
    </div>
  );
}

function btn(color) {
  return {
    padding: '6px 14px', borderRadius: 8, border: `1px solid ${color}`, background: 'transparent',
    color, cursor: 'pointer', fontSize: 13, fontWeight: 600,
  };
}
