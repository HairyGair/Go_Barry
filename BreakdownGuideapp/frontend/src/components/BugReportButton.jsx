/**
 * Bug Report Button & Modal
 * Floating button for users to report bugs and submit feedback
 */

import React, { useState } from 'react';
import './BugReportButton.css';

export default function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'bug',
    severity: 'medium',
    stepsToReproduce: '',
    reporterName: '',
    reporterEmail: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Gather system context
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      };

      const bugReport = {
        ...formData,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        browserInfo,
        appVersion: '3.0.0',
        environment: import.meta.env.VITE_ENV || 'production'
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bug-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bugReport)
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setFormData({
            title: '',
            description: '',
            type: 'bug',
            severity: 'medium',
            stepsToReproduce: '',
            reporterName: '',
            reporterEmail: ''
          });
        }, 2000);
      } else {
        alert('Failed to submit bug report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      alert('Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) {
    return (
      <button
        className="bug-report-fab"
        onClick={() => setIsOpen(true)}
        title="Report a Bug or Give Feedback"
      >
        🐛
      </button>
    );
  }

  return (
    <div className="bug-report-overlay">
      <div className="bug-report-modal">
        <div className="bug-report-header">
          <h2>Report a Bug or Issue</h2>
          <button
            className="bug-report-close"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="bug-report-success">
            <div className="success-icon">✓</div>
            <h3>Thank You!</h3>
            <p>Your bug report has been submitted successfully.</p>
            <p className="success-subtext">
              We'll review it and get back to you if we need more information.
            </p>
          </div>
        ) : (
          <form className="bug-report-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="bug">🐛 Bug</option>
                  <option value="error">❌ Error/Crash</option>
                  <option value="feature">💡 Feature Request</option>
                  <option value="feedback">💬 Feedback</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="severity">Severity *</label>
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Brief description of the issue"
                required
                maxLength={255}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed description of what happened"
                required
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="stepsToReproduce">Steps to Reproduce</label>
              <textarea
                id="stepsToReproduce"
                name="stepsToReproduce"
                value={formData.stepsToReproduce}
                onChange={handleChange}
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reporterName">Your Name (Optional)</label>
                <input
                  type="text"
                  id="reporterName"
                  name="reporterName"
                  value={formData.reporterName}
                  onChange={handleChange}
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reporterEmail">Your Email (Optional)</label>
                <input
                  type="email"
                  id="reporterEmail"
                  name="reporterEmail"
                  value={formData.reporterEmail}
                  onChange={handleChange}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="bug-report-context-info">
              <small>
                📍 Current page: {window.location.pathname}
                <br />
                🌐 Browser: {navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown'}
              </small>
            </div>

            <div className="bug-report-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
