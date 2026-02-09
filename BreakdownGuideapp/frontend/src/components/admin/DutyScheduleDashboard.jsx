/**
 * Duty Schedule Dashboard - Admin Component
 * Phase 5.1: Allows admins to pre-assign duty shifts to supervisors
 *
 * Features:
 * - View all scheduled duties (today, week, month)
 * - Create new duty assignments
 * - Edit/cancel existing schedules
 * - Real-time supervisor status overview
 * - Conflict detection
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './DutyScheduleDashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

// Standard duty templates with colors
const DUTY_TEMPLATES = {
  '100': { name: 'Early Shift', start: '06:00', end: '15:30', color: '#3b82f6', icon: '🌅' },
  '200': { name: 'Day Shift', start: '07:30', end: '17:00', color: '#10b981', icon: '☀️' },
  '400': { name: 'Late Shift', start: '12:30', end: '22:00', color: '#f59e0b', icon: '🌆' },
  '500': { name: 'Night Shift', start: '14:45', end: '00:15', color: '#8b5cf6', icon: '🌙' }
};

const DutyScheduleDashboard = () => {
  const { currentUser, getAuthHeaders } = useAuth();

  // State
  const [schedules, setSchedules] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [supervisorStatus, setSupervisorStatus] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View state
  const [view, setView] = useState('week'); // today, week, month
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDepot, setSelectedDepot] = useState('');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    supervisor_id: '',
    duty_code: '100',
    schedule_date: new Date().toISOString().split('T')[0],
    start_time: '06:00',
    end_time: '15:30',
    notes: ''
  });

  // Force Assignment & Override state (Phase 5.2 & 5.3)
  const [showForceModal, setShowForceModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedSupervisorForAction, setSelectedSupervisorForAction] = useState(null);
  const [forceData, setForceData] = useState({
    duty_code: '100',
    reason: '',
    notes: ''
  });
  const [overrideData, setOverrideData] = useState({
    new_duty_code: '100',
    reason: '',
    effective_immediately: true
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Shift Templates state (Phase 5.4)
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateFormData, setTemplateFormData] = useState({
    template_code: '',
    name: '',
    start_time: '06:00',
    end_time: '15:30',
    color: '#3b82f6',
    icon: '📋',
    description: '',
    is_active: true
  });

  // Calculate date range based on view
  const getDateRange = useCallback(() => {
    const today = new Date();
    let start_date, end_date;

    if (view === 'today') {
      start_date = today.toISOString().split('T')[0];
      end_date = start_date;
    } else if (view === 'week') {
      start_date = today.toISOString().split('T')[0];
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      end_date = weekEnd.toISOString().split('T')[0];
    } else {
      start_date = today.toISOString().split('T')[0];
      const monthEnd = new Date(today);
      monthEnd.setMonth(today.getMonth() + 1);
      end_date = monthEnd.toISOString().split('T')[0];
    }

    return { start_date, end_date };
  }, [view]);

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    try {
      const { start_date, end_date } = getDateRange();
      let url = `${API_BASE}/api/admin/duty/schedules?start_date=${start_date}&end_date=${end_date}`;

      if (selectedDepot) {
        url += `&depot=${selectedDepot}`;
      }

      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch schedules');

      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err.message);
    }
  }, [getDateRange, selectedDepot, getAuthHeaders]);

  // Fetch supervisor status
  const fetchSupervisorStatus = useCallback(async () => {
    try {
      let url = `${API_BASE}/api/admin/duty/supervisors/status`;
      if (selectedDepot) {
        url += `?depot=${selectedDepot}`;
      }

      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch supervisor status');

      const data = await response.json();
      setSupervisorStatus(data);
      setSupervisors(data.supervisors || []);
    } catch (err) {
      console.error('Error fetching supervisor status:', err);
    }
  }, [selectedDepot, getAuthHeaders]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/duty/templates`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  }, [getAuthHeaders]);

  // Fetch conflicts
  const fetchConflicts = useCallback(async () => {
    try {
      const { start_date, end_date } = getDateRange();
      const response = await fetch(
        `${API_BASE}/api/admin/duty/conflicts?start_date=${start_date}&end_date=${end_date}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Failed to fetch conflicts');

      const data = await response.json();
      setConflicts(data.conflicts || []);
    } catch (err) {
      console.error('Error fetching conflicts:', err);
    }
  }, [getDateRange, getAuthHeaders]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchSchedules(),
        fetchSupervisorStatus(),
        fetchTemplates(),
        fetchConflicts()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchSchedules, fetchSupervisorStatus, fetchTemplates, fetchConflicts]);

  // Handle duty code change - update times
  const handleDutyCodeChange = (code) => {
    const template = DUTY_TEMPLATES[code];
    if (template) {
      setFormData(prev => ({
        ...prev,
        duty_code: code,
        start_time: template.start,
        end_time: template.end
      }));
    } else {
      setFormData(prev => ({ ...prev, duty_code: code }));
    }
  };

  // Create schedule
  const handleCreateSchedule = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/api/admin/duty/schedules`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          duty_name: DUTY_TEMPLATES[formData.duty_code]?.name || formData.duty_code
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create schedule');
      }

      await fetchSchedules();
      await fetchSupervisorStatus();
      setShowCreateModal(false);
      resetForm();

    } catch (err) {
      console.error('Error creating schedule:', err);
      alert(err.message);
    }
  };

  // Update schedule
  const handleUpdateSchedule = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/api/admin/duty/schedules/${editingSchedule.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          duty_code: formData.duty_code,
          duty_name: DUTY_TEMPLATES[formData.duty_code]?.name || formData.duty_code,
          schedule_date: formData.schedule_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          notes: formData.notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update schedule');
      }

      await fetchSchedules();
      setEditingSchedule(null);
      resetForm();

    } catch (err) {
      console.error('Error updating schedule:', err);
      alert(err.message);
    }
  };

  // Delete/cancel schedule
  const handleDeleteSchedule = async (scheduleId, hardDelete = false) => {
    const confirmMessage = hardDelete
      ? 'Permanently delete this schedule?'
      : 'Cancel this schedule?';

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/admin/duty/schedules/${scheduleId}?hard_delete=${hardDelete}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) throw new Error('Failed to delete schedule');

      await fetchSchedules();

    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert(err.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      supervisor_id: '',
      duty_code: '100',
      schedule_date: new Date().toISOString().split('T')[0],
      start_time: '06:00',
      end_time: '15:30',
      notes: ''
    });
  };

  // ============================================
  // FORCE ASSIGNMENT HANDLERS (Phase 5.2)
  // ============================================

  // Open force assignment modal
  const openForceModal = (supervisor) => {
    setSelectedSupervisorForAction(supervisor);
    setForceData({
      duty_code: '100',
      reason: '',
      notes: ''
    });
    setShowForceModal(true);
  };

  // Handle force assignment
  const handleForceAssign = async (e) => {
    e.preventDefault();

    if (!forceData.reason.trim()) {
      alert('Please provide a reason for force assignment');
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/duty/force-assign`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          supervisor_id: selectedSupervisorForAction.id,
          duty_code: forceData.duty_code,
          reason: forceData.reason,
          notes: forceData.notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to force-assign duty');
      }

      const result = await response.json();
      alert(`Success: ${result.message}`);

      await fetchSchedules();
      await fetchSupervisorStatus();
      setShowForceModal(false);
      setSelectedSupervisorForAction(null);

    } catch (err) {
      console.error('Error force-assigning duty:', err);
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // OVERRIDE HANDLERS (Phase 5.3)
  // ============================================

  // Open override modal
  const openOverrideModal = (supervisor) => {
    setSelectedSupervisorForAction(supervisor);
    setOverrideData({
      new_duty_code: supervisor.current_duty === '100' ? '200' : '100',
      reason: '',
      effective_immediately: true
    });
    setShowOverrideModal(true);
  };

  // Handle duty override
  const handleOverride = async (e) => {
    e.preventDefault();

    if (!overrideData.reason.trim()) {
      alert('Please provide a reason for the override');
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/duty/override`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          supervisor_id: selectedSupervisorForAction.id,
          new_duty_code: overrideData.new_duty_code,
          reason: overrideData.reason,
          effective_immediately: overrideData.effective_immediately
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to override duty');
      }

      const result = await response.json();
      alert(`Success: ${result.message}`);

      await fetchSchedules();
      await fetchSupervisorStatus();
      setShowOverrideModal(false);
      setSelectedSupervisorForAction(null);

    } catch (err) {
      console.error('Error overriding duty:', err);
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle end shift
  const handleEndShift = async (supervisor) => {
    if (!window.confirm(`End ${supervisor.name}'s current shift?`)) return;

    const reason = window.prompt('Reason for ending shift (optional):');

    setActionLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/duty/end-shift`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          supervisor_id: supervisor.id,
          reason: reason || 'Manual end by admin'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to end shift');
      }

      const result = await response.json();
      alert(`Success: ${result.message}`);

      await fetchSchedules();
      await fetchSupervisorStatus();

    } catch (err) {
      console.error('Error ending shift:', err);
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      supervisor_id: schedule.supervisor_id,
      duty_code: schedule.duty_code,
      schedule_date: schedule.schedule_date.split('T')[0],
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      notes: schedule.notes || ''
    });
  };

  // ============================================
  // SHIFT TEMPLATE HANDLERS (Phase 5.4)
  // ============================================

  // Reset template form
  const resetTemplateForm = () => {
    setTemplateFormData({
      template_code: '',
      name: '',
      start_time: '06:00',
      end_time: '15:30',
      color: '#3b82f6',
      icon: '📋',
      description: '',
      is_active: true
    });
  };

  // Open template edit modal
  const openTemplateEditModal = (template) => {
    setEditingTemplate(template);
    setTemplateFormData({
      template_code: template.template_code,
      name: template.name,
      start_time: template.start_time,
      end_time: template.end_time,
      color: template.color || '#3b82f6',
      icon: template.icon || '📋',
      description: template.description || '',
      is_active: template.is_active !== false
    });
    setShowTemplateModal(true);
  };

  // Create new template
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/duty/templates`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create template');
      }

      await fetchTemplates();
      setShowTemplateModal(false);
      resetTemplateForm();
      alert('Template created successfully!');

    } catch (err) {
      console.error('Error creating template:', err);
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Update template
  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/duty/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update template');
      }

      await fetchTemplates();
      setShowTemplateModal(false);
      setEditingTemplate(null);
      resetTemplateForm();
      alert('Template updated successfully!');

    } catch (err) {
      console.error('Error updating template:', err);
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    setActionLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/duty/templates/${templateId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }

      await fetchTemplates();
      alert('Template deleted successfully!');

    } catch (err) {
      console.error('Error deleting template:', err);
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Available icons for templates
  const TEMPLATE_ICONS = ['🌅', '☀️', '🌆', '🌙', '📋', '⏰', '🚌', '👷', '🛠️', '⚡'];
  const TEMPLATE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

  // Format time for display
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'confirmed': return '#3b82f6';
      case 'scheduled': return '#6b7280';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (currentStatus) => {
    switch (currentStatus) {
      case 'on_duty':
      case 'active':
        return 'status-badge status-active';
      case 'scheduled':
      case 'confirmed':
        return 'status-badge status-scheduled';
      case 'off_duty':
        return 'status-badge status-off';
      default:
        return 'status-badge';
    }
  };

  if (loading) {
    return (
      <div className="duty-schedule-dashboard loading">
        <div className="loading-spinner">
          <span className="spinner"></span>
          <p>Loading duty schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="duty-schedule-dashboard">
      {/* Header */}
      <div className="schedule-header">
        <div className="header-left">
          <h1>📅 Duty Schedule Management</h1>
          <p className="header-subtitle">Pre-assign shifts to supervisors</p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <span>➕</span> New Schedule
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="schedule-controls">
        <div className="view-toggle">
          <button
            className={view === 'today' ? 'active' : ''}
            onClick={() => setView('today')}
          >
            Today
          </button>
          <button
            className={view === 'week' ? 'active' : ''}
            onClick={() => setView('week')}
          >
            Week
          </button>
          <button
            className={view === 'month' ? 'active' : ''}
            onClick={() => setView('month')}
          >
            Month
          </button>
        </div>

        <div className="depot-filter">
          <select
            value={selectedDepot}
            onChange={(e) => setSelectedDepot(e.target.value)}
          >
            <option value="">All Depots</option>
            <option value="SDC">Operations</option>
            <option value="Washington">Washington</option>
            <option value="Riverside">Riverside</option>
            <option value="Consett">Consett</option>
            <option value="Deptford">Deptford</option>
            <option value="Percy Main">Percy Main</option>
            <option value="Hexham">Hexham</option>
          </select>
        </div>

        <button className="btn btn-secondary" onClick={() => {
          fetchSchedules();
          fetchSupervisorStatus();
        }}>
          🔄 Refresh
        </button>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="conflicts-alert">
          <span className="alert-icon">⚠️</span>
          <span>{conflicts.length} schedule conflict{conflicts.length > 1 ? 's' : ''} detected</span>
          <button onClick={() => alert(JSON.stringify(conflicts, null, 2))}>
            View Details
          </button>
        </div>
      )}

      {/* Supervisor Status Overview */}
      {supervisorStatus && (
        <div className="supervisor-overview">
          <h2>Supervisor Status</h2>
          <div className="status-summary">
            <div className="status-card on-duty">
              <span className="count">{supervisorStatus.summary.on_duty}</span>
              <span className="label">On Duty</span>
            </div>
            <div className="status-card scheduled">
              <span className="count">{supervisorStatus.summary.scheduled}</span>
              <span className="label">Scheduled</span>
            </div>
            <div className="status-card off-duty">
              <span className="count">{supervisorStatus.summary.off_duty}</span>
              <span className="label">Off Duty</span>
            </div>
            <div className="status-card total">
              <span className="count">{supervisorStatus.summary.total_supervisors}</span>
              <span className="label">Total</span>
            </div>
          </div>

          {/* Supervisor Actions List (Phase 5.2 & 5.3) */}
          <div className="supervisor-actions-list">
            <h3>Quick Actions</h3>
            <div className="supervisor-grid">
              {supervisors.map(supervisor => (
                <div key={supervisor.id} className={`supervisor-row ${supervisor.current_status}`}>
                  <div className="supervisor-info">
                    <span className="badge">{supervisor.badge_number}</span>
                    <span className="name">{supervisor.name}</span>
                    {supervisor.current_duty && (
                      <span
                        className="duty-badge"
                        style={{ backgroundColor: DUTY_TEMPLATES[supervisor.current_duty]?.color || '#6b7280' }}
                      >
                        {DUTY_TEMPLATES[supervisor.current_duty]?.icon} {supervisor.current_duty}
                      </span>
                    )}
                    <span className={`status-indicator ${supervisor.current_status}`}>
                      {supervisor.current_status === 'on_duty' || supervisor.current_status === 'active' ? '🟢' : '⚪'}
                    </span>
                  </div>
                  <div className="supervisor-actions">
                    <button
                      className="action-btn force"
                      onClick={() => openForceModal(supervisor)}
                      title="Force Assign Duty"
                      disabled={actionLoading}
                    >
                      ⚡ Force Assign
                    </button>
                    {supervisor.current_duty && (
                      <>
                        <button
                          className="action-btn override"
                          onClick={() => openOverrideModal(supervisor)}
                          title="Override Duty"
                          disabled={actionLoading}
                        >
                          🔄 Override
                        </button>
                        <button
                          className="action-btn end"
                          onClick={() => handleEndShift(supervisor)}
                          title="End Shift"
                          disabled={actionLoading}
                        >
                          ⏹️ End
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedules Grid */}
      <div className="schedules-section">
        <h2>Upcoming Schedules</h2>

        {schedules.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No schedules found for this period</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create First Schedule
            </button>
          </div>
        ) : (
          <div className="schedules-grid">
            {schedules.map(schedule => (
              <div
                key={schedule.id}
                className={`schedule-card ${schedule.status}`}
                style={{
                  borderLeftColor: schedule.color || DUTY_TEMPLATES[schedule.duty_code]?.color || '#6b7280'
                }}
              >
                <div className="card-header">
                  <span className="duty-icon">
                    {schedule.icon || DUTY_TEMPLATES[schedule.duty_code]?.icon || '📋'}
                  </span>
                  <div className="card-title">
                    <h3>Duty {schedule.duty_code}</h3>
                    <span className="schedule-date">{formatDate(schedule.schedule_date)}</span>
                  </div>
                  <span
                    className="status-tag"
                    style={{ backgroundColor: getStatusColor(schedule.status) }}
                  >
                    {schedule.status}
                  </span>
                </div>

                <div className="card-body">
                  <div className="supervisor-info">
                    <span className="badge">{schedule.supervisor_badge}</span>
                    <span className="name">{schedule.supervisor_name}</span>
                  </div>

                  <div className="time-info">
                    <span className="time-icon">⏰</span>
                    <span>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
                  </div>

                  {schedule.depot && (
                    <div className="depot-info">
                      <span className="depot-icon">📍</span>
                      <span>{schedule.depot}</span>
                    </div>
                  )}

                  {schedule.notes && (
                    <div className="notes-info">
                      <span className="notes-icon">📝</span>
                      <span>{schedule.notes}</span>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    className="btn-icon edit"
                    onClick={() => openEditModal(schedule)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon cancel"
                    onClick={() => handleDeleteSchedule(schedule.id, false)}
                    title="Cancel"
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shift Templates Section (Phase 5.4) */}
      <div className="templates-section">
        <div className="section-header">
          <h2>🎨 Shift Templates</h2>
          <button
            className="btn btn-secondary"
            onClick={() => {
              resetTemplateForm();
              setEditingTemplate(null);
              setShowTemplateModal(true);
            }}
          >
            ➕ New Template
          </button>
        </div>

        <div className="templates-grid">
          {templates.map(template => (
            <div
              key={template.id}
              className={`template-card ${!template.is_active ? 'inactive' : ''}`}
              style={{ borderLeftColor: template.color || '#3b82f6' }}
            >
              <div className="template-header">
                <span className="template-icon" style={{ backgroundColor: template.color }}>
                  {template.icon || '📋'}
                </span>
                <div className="template-info">
                  <h3 className="template-code">{template.template_code}</h3>
                  <span className="template-name">{template.name}</span>
                </div>
                {!template.is_active && (
                  <span className="inactive-badge">Inactive</span>
                )}
              </div>

              <div className="template-body">
                <div className="template-time">
                  <span className="time-icon">⏰</span>
                  <span>{formatTime(template.start_time)} - {formatTime(template.end_time)}</span>
                </div>

                {template.description && (
                  <p className="template-description">{template.description}</p>
                )}

                <div className="template-meta">
                  {template.is_standard && (
                    <span className="standard-badge">🏢 Standard</span>
                  )}
                  {template.usage_count !== undefined && (
                    <span className="usage-count">📊 Used {template.usage_count}x</span>
                  )}
                </div>
              </div>

              <div className="template-actions">
                <button
                  className="btn-icon edit"
                  onClick={() => openTemplateEditModal(template)}
                  title="Edit Template"
                  disabled={actionLoading}
                >
                  ✏️
                </button>
                {!template.is_standard && (
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDeleteTemplate(template.id)}
                    title="Delete Template"
                    disabled={actionLoading}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">🎨</span>
              <p>No custom shift templates yet</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  resetTemplateForm();
                  setEditingTemplate(null);
                  setShowTemplateModal(true);
                }}
              >
                Create First Template
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSchedule) && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setEditingSchedule(null);
          resetForm();
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingSchedule(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}>
              <div className="form-grid">
                {/* Supervisor Selection (only for new schedules) */}
                {!editingSchedule && (
                  <div className="form-group full-width">
                    <label>Supervisor</label>
                    <select
                      value={formData.supervisor_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, supervisor_id: e.target.value }))}
                      required
                    >
                      <option value="">Select Supervisor...</option>
                      {supervisors.map(sup => (
                        <option key={sup.id} value={sup.id}>
                          {sup.badge_number} - {sup.name} ({sup.depot})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Duty Code Selection */}
                <div className="form-group">
                  <label>Duty Shift</label>
                  <div className="duty-options">
                    {Object.entries(DUTY_TEMPLATES).map(([code, template]) => (
                      <button
                        key={code}
                        type="button"
                        className={`duty-option ${formData.duty_code === code ? 'selected' : ''}`}
                        style={{ borderColor: template.color }}
                        onClick={() => handleDutyCodeChange(code)}
                      >
                        <span className="duty-icon">{template.icon}</span>
                        <span className="duty-code">{code}</span>
                        <span className="duty-time">{template.start}-{template.end}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.schedule_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, schedule_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {/* Start Time */}
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    required
                  />
                </div>

                {/* End Time */}
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    required
                  />
                </div>

                {/* Notes */}
                <div className="form-group full-width">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special instructions or notes..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingSchedule(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Force Assignment Modal (Phase 5.2) */}
      {showForceModal && selectedSupervisorForAction && (
        <div className="modal-overlay" onClick={() => setShowForceModal(false)}>
          <div className="modal-content force-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header force-header">
              <h2>⚡ Force Assign Duty</h2>
              <button className="modal-close" onClick={() => setShowForceModal(false)}>×</button>
            </div>

            <form onSubmit={handleForceAssign}>
              <div className="force-info">
                <p>
                  Force-assigning a duty to <strong>{selectedSupervisorForAction.name}</strong>
                  {selectedSupervisorForAction.current_duty && (
                    <span> (currently on Duty {selectedSupervisorForAction.current_duty})</span>
                  )}
                </p>
                <p className="warning-text">
                  ⚠️ This will immediately start the selected duty, ending any current assignment.
                </p>
              </div>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Select Duty</label>
                  <div className="duty-options">
                    {Object.entries(DUTY_TEMPLATES).map(([code, template]) => (
                      <button
                        key={code}
                        type="button"
                        className={`duty-option ${forceData.duty_code === code ? 'selected' : ''}`}
                        style={{ borderColor: template.color }}
                        onClick={() => setForceData(prev => ({ ...prev, duty_code: code }))}
                      >
                        <span className="duty-icon">{template.icon}</span>
                        <span className="duty-code">{code}</span>
                        <span className="duty-time">{template.start}-{template.end}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Reason for Force Assignment *</label>
                  <textarea
                    value={forceData.reason}
                    onChange={(e) => setForceData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Why is this force assignment needed?"
                    rows={2}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Additional Notes (Optional)</label>
                  <textarea
                    value={forceData.notes}
                    onChange={(e) => setForceData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForceModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-force" disabled={actionLoading}>
                  {actionLoading ? 'Assigning...' : '⚡ Force Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Override Modal (Phase 5.3) */}
      {showOverrideModal && selectedSupervisorForAction && (
        <div className="modal-overlay" onClick={() => setShowOverrideModal(false)}>
          <div className="modal-content override-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header override-header">
              <h2>🔄 Override Duty</h2>
              <button className="modal-close" onClick={() => setShowOverrideModal(false)}>×</button>
            </div>

            <form onSubmit={handleOverride}>
              <div className="override-info">
                <p>
                  Overriding duty for <strong>{selectedSupervisorForAction.name}</strong>
                </p>
                <p>
                  Current duty: <strong>Duty {selectedSupervisorForAction.current_duty || 'None'}</strong>
                </p>
              </div>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>New Duty</label>
                  <div className="duty-options">
                    {Object.entries(DUTY_TEMPLATES).map(([code, template]) => (
                      <button
                        key={code}
                        type="button"
                        className={`duty-option ${overrideData.new_duty_code === code ? 'selected' : ''}`}
                        style={{ borderColor: template.color }}
                        onClick={() => setOverrideData(prev => ({ ...prev, new_duty_code: code }))}
                      >
                        <span className="duty-icon">{template.icon}</span>
                        <span className="duty-code">{code}</span>
                        <span className="duty-time">{template.start}-{template.end}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Reason for Override *</label>
                  <textarea
                    value={overrideData.reason}
                    onChange={(e) => setOverrideData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Why is this override needed?"
                    rows={2}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={overrideData.effective_immediately}
                      onChange={(e) => setOverrideData(prev => ({
                        ...prev,
                        effective_immediately: e.target.checked
                      }))}
                    />
                    <span>Effective immediately</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowOverrideModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-override" disabled={actionLoading}>
                  {actionLoading ? 'Overriding...' : '🔄 Override Duty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Modal (Phase 5.4) */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => {
          setShowTemplateModal(false);
          setEditingTemplate(null);
          resetTemplateForm();
        }}>
          <div className="modal-content template-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header template-header">
              <h2>🎨 {editingTemplate ? 'Edit Template' : 'Create New Template'}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowTemplateModal(false);
                  setEditingTemplate(null);
                  resetTemplateForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
              <div className="form-grid">
                {/* Template Code */}
                <div className="form-group">
                  <label>Template Code *</label>
                  <input
                    type="text"
                    value={templateFormData.template_code}
                    onChange={(e) => setTemplateFormData(prev => ({
                      ...prev,
                      template_code: e.target.value.toUpperCase()
                    }))}
                    placeholder="e.g., 600, SPLIT, CUSTOM"
                    required
                    disabled={editingTemplate?.is_standard}
                  />
                </div>

                {/* Template Name */}
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={templateFormData.name}
                    onChange={(e) => setTemplateFormData(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    placeholder="e.g., Split Shift, Weekend Cover"
                    required
                  />
                </div>

                {/* Start Time */}
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    value={templateFormData.start_time}
                    onChange={(e) => setTemplateFormData(prev => ({
                      ...prev,
                      start_time: e.target.value
                    }))}
                    required
                  />
                </div>

                {/* End Time */}
                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="time"
                    value={templateFormData.end_time}
                    onChange={(e) => setTemplateFormData(prev => ({
                      ...prev,
                      end_time: e.target.value
                    }))}
                    required
                  />
                </div>

                {/* Icon Selector */}
                <div className="form-group full-width">
                  <label>Icon</label>
                  <div className="icon-selector">
                    {TEMPLATE_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${templateFormData.icon === icon ? 'selected' : ''}`}
                        onClick={() => setTemplateFormData(prev => ({ ...prev, icon }))}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selector */}
                <div className="form-group full-width">
                  <label>Color</label>
                  <div className="color-selector">
                    {TEMPLATE_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${templateFormData.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setTemplateFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                    <input
                      type="color"
                      value={templateFormData.color}
                      onChange={(e) => setTemplateFormData(prev => ({
                        ...prev,
                        color: e.target.value
                      }))}
                      className="custom-color"
                      title="Custom color"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="form-group full-width">
                  <label>Description (Optional)</label>
                  <textarea
                    value={templateFormData.description}
                    onChange={(e) => setTemplateFormData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Describe when this template should be used..."
                    rows={2}
                  />
                </div>

                {/* Active Toggle */}
                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={templateFormData.is_active}
                      onChange={(e) => setTemplateFormData(prev => ({
                        ...prev,
                        is_active: e.target.checked
                      }))}
                    />
                    <span>Template is active and can be used for scheduling</span>
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div className="template-preview">
                <h4>Preview</h4>
                <div
                  className="preview-card"
                  style={{ borderLeftColor: templateFormData.color }}
                >
                  <span className="preview-icon" style={{ backgroundColor: templateFormData.color }}>
                    {templateFormData.icon}
                  </span>
                  <div className="preview-info">
                    <span className="preview-code">
                      {templateFormData.template_code || 'CODE'}
                    </span>
                    <span className="preview-name">
                      {templateFormData.name || 'Template Name'}
                    </span>
                    <span className="preview-time">
                      ⏰ {templateFormData.start_time} - {templateFormData.end_time}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowTemplateModal(false);
                    setEditingTemplate(null);
                    resetTemplateForm();
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-template" disabled={actionLoading}>
                  {actionLoading
                    ? (editingTemplate ? 'Updating...' : 'Creating...')
                    : (editingTemplate ? '✅ Update Template' : '✅ Create Template')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-toast">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
    </div>
  );
};

export default DutyScheduleDashboard;
