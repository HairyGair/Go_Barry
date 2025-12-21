/**
 * DutyNotesWidget Component
 * Quick note input for supervisors during their shift
 *
 * Features:
 * - Floating add note button
 * - Quick note input modal
 * - Note type selection (general, priority, etc.)
 * - View recent notes
 * - Notes tied to current duty session
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import './DutyNotesWidget.css';

const NOTE_TYPES = [
  { value: 'general', label: 'General', icon: '📝', color: '#3B82F6' },
  { value: 'priority', label: 'Priority', icon: '📌', color: '#EF4444' },
  { value: 'breakdown', label: 'Breakdown', icon: '🔧', color: '#F59E0B' },
  { value: 'info', label: 'Info', icon: 'ℹ️', color: '#8B5CF6' }
];

const DutyNotesWidget = ({ currentDuty, position = 'bottom-left' }) => {
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isViewingNotes, setIsViewingNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [isPriority, setIsPriority] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingNoteId, setDeletingNoteId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

  // Fetch notes on mount and when duty changes
  useEffect(() => {
    if (currentDuty?.code && currentUser?.badge_number) {
      fetchCurrentNotes();
    }
  }, [currentDuty?.code, currentUser?.badge_number]);

  const fetchCurrentNotes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        badge: currentUser?.badge_number,
        duty_code: currentDuty?.code
      });

      const response = await fetch(`${API_URL}/api/duty/notes/current?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
        // Count notes added in last hour as "new"
        const recentNotes = (data.notes || []).filter(n => {
          const created = new Date(n.created_at);
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return created > hourAgo;
        });
        setUnreadCount(recentNotes.length);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !currentDuty?.code) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const noteData = {
        note: noteText.trim(),
        note_type: isPriority ? 'priority' : noteType,
        is_priority: isPriority,
        duty_code: currentDuty.code,
        duty_start_time: currentDuty.shiftStart,
        supervisor_badge: currentUser?.badge_number,
        supervisor_name: currentUser?.name,
        supervisor_id: currentUser?.id
      };

      const response = await fetch(`${API_URL}/api/duty/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(noteData)
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      const result = await response.json();

      // Add to local notes list
      setNotes(prev => [result.note, ...prev]);

      // Clear form
      setNoteText('');
      setNoteType('general');
      setIsPriority(false);

      // Show success
      setSuccessMessage('Note saved!');
      setTimeout(() => setSuccessMessage(null), 2000);

      // Collapse after short delay
      setTimeout(() => setIsExpanded(false), 1500);

    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    setDeletingNoteId(noteId);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/duty/notes/${noteId}?badge=${currentUser?.badge_number}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete note');
      }

      // Remove from local notes list
      setNotes(prev => prev.filter(n => n.id !== noteId));
      setSuccessMessage('Note deleted!');
      setTimeout(() => setSuccessMessage(null), 2000);

    } catch (err) {
      console.error('Error deleting note:', err);
      setError(err.message || 'Failed to delete note. Please try again.');
    } finally {
      setDeletingNoteId(null);
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const created = new Date(date);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return created.toLocaleDateString();
  };

  const getNoteTypeConfig = (type) => {
    return NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[0];
  };

  // Don't render if no duty selected
  if (!currentDuty?.code) {
    return null;
  }

  return (
    <div className={`duty-notes-widget duty-notes-widget--${position}`}>
      {/* Floating Button */}
      <button
        className={`duty-notes-widget__trigger ${isExpanded ? 'active' : ''}`}
        onClick={() => {
          setIsExpanded(!isExpanded);
          setIsViewingNotes(false);
        }}
        aria-label="Add shift note"
      >
        <span className="duty-notes-widget__trigger-icon">
          {isExpanded ? '✕' : '📝'}
        </span>
        {unreadCount > 0 && !isExpanded && (
          <span className="duty-notes-widget__badge">{unreadCount}</span>
        )}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="duty-notes-widget__panel">
          <div className="duty-notes-widget__header">
            <h3>Shift Notes</h3>
            <div className="duty-notes-widget__tabs">
              <button
                className={`duty-notes-widget__tab ${!isViewingNotes ? 'active' : ''}`}
                onClick={() => setIsViewingNotes(false)}
              >
                Add Note
              </button>
              <button
                className={`duty-notes-widget__tab ${isViewingNotes ? 'active' : ''}`}
                onClick={() => {
                  setIsViewingNotes(true);
                  fetchCurrentNotes();
                }}
              >
                View ({notes.length})
              </button>
            </div>
          </div>

          {!isViewingNotes ? (
            /* Add Note Form */
            <form className="duty-notes-widget__form" onSubmit={handleSubmit}>
              {error && (
                <div className="duty-notes-widget__error">{error}</div>
              )}

              {successMessage && (
                <div className="duty-notes-widget__success">{successMessage}</div>
              )}

              <div className="duty-notes-widget__type-selector">
                {NOTE_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    className={`duty-notes-widget__type-btn ${noteType === type.value ? 'active' : ''}`}
                    onClick={() => {
                      setNoteType(type.value);
                      setIsPriority(type.value === 'priority');
                    }}
                    style={{ '--type-color': type.color }}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>

              <textarea
                className="duty-notes-widget__input"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your note..."
                rows={3}
                maxLength={1000}
              />

              <div className="duty-notes-widget__footer">
                <span className="duty-notes-widget__char-count">
                  {noteText.length}/1000
                </span>
                <button
                  type="submit"
                  className="duty-notes-widget__submit"
                  disabled={!noteText.trim() || isSubmitting}
                >
                  {isSubmitting ? '...' : 'Save Note'}
                </button>
              </div>
            </form>
          ) : (
            /* View Notes List */
            <div className="duty-notes-widget__notes-list">
              {isLoading ? (
                <div className="duty-notes-widget__loading">Loading...</div>
              ) : notes.length === 0 ? (
                <div className="duty-notes-widget__empty">
                  No notes for this shift yet
                </div>
              ) : (
                notes.map(note => {
                  const typeConfig = getNoteTypeConfig(note.note_type);
                  const isDeleting = deletingNoteId === note.id;
                  return (
                    <div
                      key={note.id}
                      className={`duty-notes-widget__note ${note.is_priority ? 'priority' : ''} ${isDeleting ? 'deleting' : ''}`}
                    >
                      <div className="duty-notes-widget__note-header">
                        <span
                          className="duty-notes-widget__note-type"
                          style={{ backgroundColor: typeConfig.color }}
                        >
                          {typeConfig.icon} {typeConfig.label}
                        </span>
                        <div className="duty-notes-widget__note-actions">
                          <span className="duty-notes-widget__note-time">
                            {formatTimeAgo(note.created_at)}
                          </span>
                          <button
                            className="duty-notes-widget__delete-btn"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={isDeleting}
                            title="Delete note"
                            aria-label="Delete note"
                          >
                            {isDeleting ? '...' : '🗑️'}
                          </button>
                        </div>
                      </div>
                      <p className="duty-notes-widget__note-content">
                        {note.note}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}

          <div className="duty-notes-widget__duty-info">
            <span>Duty {currentDuty.code}</span>
            <span>{currentDuty.startTime} - {currentDuty.endTime}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DutyNotesWidget;
