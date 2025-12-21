/**
 * VoiceAnnouncementSettings Component
 * Phase 6.2: Settings for voice announcements (accessibility)
 *
 * Features:
 * - Enable/disable voice announcements
 * - Voice selection (from available system voices)
 * - Speech rate control
 * - Volume control
 * - Test announcement button
 */

import React, { useState, useEffect } from 'react';
import voiceAnnouncementService from '../services/voiceAnnouncementService.js';
import './VoiceAnnouncementSettings.css';

const VoiceAnnouncementSettings = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    rate: 1.0,
    volume: 1.0,
    voiceName: null,
    isSupported: true
  });
  const [voices, setVoices] = useState([]);
  const [testing, setTesting] = useState(false);

  // Load settings and voices on mount
  useEffect(() => {
    const loadedSettings = voiceAnnouncementService.getSettings();
    setSettings(loadedSettings);

    // Load available voices
    const loadVoices = () => {
      const availableVoices = voiceAnnouncementService.getAvailableVoices();
      setVoices(availableVoices);
    };

    // Voices may load async
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Toggle enabled
  const handleToggleEnabled = () => {
    const newValue = !settings.enabled;
    voiceAnnouncementService.setEnabled(newValue);
    setSettings(prev => ({ ...prev, enabled: newValue }));
  };

  // Change voice
  const handleVoiceChange = (e) => {
    const voiceName = e.target.value;
    voiceAnnouncementService.setVoice(voiceName);
    setSettings(prev => ({ ...prev, voiceName }));
  };

  // Change rate
  const handleRateChange = (e) => {
    const rate = parseFloat(e.target.value);
    voiceAnnouncementService.setRate(rate);
    setSettings(prev => ({ ...prev, rate }));
  };

  // Change volume
  const handleVolumeChange = (e) => {
    const volume = parseFloat(e.target.value);
    voiceAnnouncementService.setVolume(volume);
    setSettings(prev => ({ ...prev, volume }));
  };

  // Test announcement
  const handleTest = () => {
    setTesting(true);
    voiceAnnouncementService.testAnnouncement();
    setTimeout(() => setTesting(false), 3000);
  };

  // Format rate for display
  const formatRate = (rate) => {
    if (rate === 1) return 'Normal';
    if (rate < 1) return `Slower (${rate}x)`;
    return `Faster (${rate}x)`;
  };

  if (!settings.isSupported) {
    return (
      <div className="voice-settings voice-settings--unsupported">
        <div className="voice-settings__header">
          <span className="voice-settings__icon">&#x1F508;</span>
          <div>
            <h3 className="voice-settings__title">Voice Announcements</h3>
            <p className="voice-settings__subtitle">Hands-free shift time awareness</p>
          </div>
        </div>
        <div className="voice-settings__unsupported-message">
          <span>&#x26A0;</span>
          <p>
            Voice announcements are not supported in your browser.
            Please use Chrome, Edge, Firefox, or Safari for this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-settings">
      <div className="voice-settings__header">
        <span className="voice-settings__icon">&#x1F508;</span>
        <div>
          <h3 className="voice-settings__title">Voice Announcements</h3>
          <p className="voice-settings__subtitle">
            Hands-free shift time awareness using text-to-speech
          </p>
        </div>
      </div>

      {/* Enable Toggle */}
      <div className="voice-settings__option voice-settings__option--main">
        <div className="option-info">
          <div className="option-header">
            <span className="option-icon">&#x1F50A;</span>
            <span className="option-title">Enable Voice Announcements</span>
          </div>
          <p className="option-description">
            Hear spoken alerts at 1 hour, 30 min, 15 min, and 5 min before shift ends
          </p>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={handleToggleEnabled}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Voice Selection */}
      <div className={`voice-settings__option ${!settings.enabled ? 'disabled' : ''}`}>
        <div className="option-info">
          <div className="option-header">
            <span className="option-icon">&#x1F5E3;</span>
            <span className="option-title">Voice</span>
          </div>
        </div>
        <select
          className="voice-select"
          value={settings.voiceName || ''}
          onChange={handleVoiceChange}
          disabled={!settings.enabled}
        >
          {voices.length === 0 && (
            <option value="">Loading voices...</option>
          )}
          {voices.map(voice => (
            <option key={voice.name} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      </div>

      {/* Speech Rate */}
      <div className={`voice-settings__option ${!settings.enabled ? 'disabled' : ''}`}>
        <div className="option-info">
          <div className="option-header">
            <span className="option-icon">&#x23E9;</span>
            <span className="option-title">Speech Speed</span>
          </div>
          <p className="option-value">{formatRate(settings.rate)}</p>
        </div>
        <input
          type="range"
          className="range-slider"
          min="0.5"
          max="1.5"
          step="0.1"
          value={settings.rate}
          onChange={handleRateChange}
          disabled={!settings.enabled}
        />
      </div>

      {/* Volume */}
      <div className={`voice-settings__option ${!settings.enabled ? 'disabled' : ''}`}>
        <div className="option-info">
          <div className="option-header">
            <span className="option-icon">&#x1F509;</span>
            <span className="option-title">Volume</span>
          </div>
          <p className="option-value">{Math.round(settings.volume * 100)}%</p>
        </div>
        <input
          type="range"
          className="range-slider"
          min="0"
          max="1"
          step="0.1"
          value={settings.volume}
          onChange={handleVolumeChange}
          disabled={!settings.enabled}
        />
      </div>

      {/* Announcement Schedule */}
      <div className="voice-settings__schedule">
        <h4>&#x1F4C5; Announcement Schedule</h4>
        <div className="schedule-list">
          <div className="schedule-item">
            <span className="schedule-time">1 hour</span>
            <span className="schedule-message">"One hour remaining in your shift"</span>
          </div>
          <div className="schedule-item">
            <span className="schedule-time">30 min</span>
            <span className="schedule-message">"30 minutes remaining"</span>
          </div>
          <div className="schedule-item">
            <span className="schedule-time">15 min</span>
            <span className="schedule-message">"15 minutes remaining"</span>
          </div>
          <div className="schedule-item schedule-item--warning">
            <span className="schedule-time">5 min</span>
            <span className="schedule-message">"Please prepare for handover"</span>
          </div>
          <div className="schedule-item schedule-item--critical">
            <span className="schedule-time">0 min</span>
            <span className="schedule-message">"Your shift has ended"</span>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <div className="voice-settings__test">
        <button
          className="test-button"
          onClick={handleTest}
          disabled={testing}
        >
          {testing ? (
            <>
              <span className="test-spinner"></span>
              Speaking...
            </>
          ) : (
            <>
              <span>&#x1F50A;</span>
              Test Voice
            </>
          )}
        </button>
        <p className="test-note">
          Click to hear a sample announcement
        </p>
      </div>

      {/* Browser Compatibility Note */}
      <div className="voice-settings__note">
        <span>&#x1F4A1;</span>
        <p>
          Voice announcements use your browser's text-to-speech engine.
          Works best in Chrome and Edge. Make sure your device volume is up.
        </p>
      </div>
    </div>
  );
};

export default VoiceAnnouncementSettings;
