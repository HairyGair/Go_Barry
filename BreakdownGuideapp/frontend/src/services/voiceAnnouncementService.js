/**
 * Voice Announcement Service
 * Phase 6.2: Accessibility feature for hands-free shift awareness
 *
 * Uses Web Speech API (SpeechSynthesis) - supported in Chrome, Edge, Firefox, Safari
 *
 * Features:
 * - Shift time announcements (1 hour, 30 min, 15 min, 5 min remaining)
 * - Configurable voice and rate
 * - Toggle in settings
 * - Respects user preferences
 */

// Voice announcement thresholds (in minutes)
const ANNOUNCEMENT_THRESHOLDS = [60, 30, 15, 5, 0];

class VoiceAnnouncementService {
  constructor() {
    this.enabled = false;
    this.voice = null;
    this.rate = 1.0;
    this.volume = 1.0;
    this.announcedThresholds = new Set();
    this.lastDutyCode = null;
    this.checkInterval = null;
    this.loadSettings();
  }

  // Check if Web Speech API is supported
  isSupported() {
    return 'speechSynthesis' in window;
  }

  // Load settings from localStorage
  loadSettings() {
    try {
      const stored = localStorage.getItem('voiceAnnouncementSettings');
      if (stored) {
        const settings = JSON.parse(stored);
        this.enabled = settings.enabled ?? false;
        this.rate = settings.rate ?? 1.0;
        this.volume = settings.volume ?? 1.0;
        // Voice is loaded separately after voices are available
      }
    } catch (e) {
      console.warn('Error loading voice announcement settings:', e);
    }
  }

  // Save settings to localStorage
  saveSettings() {
    try {
      localStorage.setItem('voiceAnnouncementSettings', JSON.stringify({
        enabled: this.enabled,
        rate: this.rate,
        volume: this.volume,
        voiceName: this.voice?.name || null
      }));
    } catch (e) {
      console.warn('Error saving voice announcement settings:', e);
    }
  }

  // Get available voices (filtered for English)
  getAvailableVoices() {
    if (!this.isSupported()) return [];

    const voices = window.speechSynthesis.getVoices();
    // Filter for English voices, prefer UK English
    return voices.filter(voice =>
      voice.lang.startsWith('en')
    ).sort((a, b) => {
      // Prefer UK English
      if (a.lang.includes('GB') && !b.lang.includes('GB')) return -1;
      if (!a.lang.includes('GB') && b.lang.includes('GB')) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  // Set voice by name
  setVoice(voiceName) {
    const voices = this.getAvailableVoices();
    this.voice = voices.find(v => v.name === voiceName) || voices[0] || null;
    this.saveSettings();
  }

  // Initialize voice (call after voices are loaded)
  initializeVoice() {
    if (!this.isSupported()) return;

    const loadVoice = () => {
      const voices = this.getAvailableVoices();
      if (voices.length > 0) {
        // Try to restore saved voice
        const stored = localStorage.getItem('voiceAnnouncementSettings');
        if (stored) {
          try {
            const settings = JSON.parse(stored);
            if (settings.voiceName) {
              this.voice = voices.find(v => v.name === settings.voiceName);
            }
          } catch (e) {}
        }
        // Default to first available voice
        if (!this.voice) {
          this.voice = voices[0];
        }
      }
    };

    // Voices may not be immediately available
    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoice;
    }
  }

  // Speak text
  speak(text) {
    if (!this.isSupported() || !this.enabled) {
      console.log('🔇 Voice announcement disabled or not supported');
      return false;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.voice;
    utterance.rate = this.rate;
    utterance.volume = this.volume;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      console.log('🔊 Speaking:', text);
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event.error);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }

  // Get current duty from session storage
  getCurrentDuty() {
    try {
      const stored = sessionStorage.getItem('currentDuty');
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }

  // Calculate remaining shift time in minutes
  getRemainingMinutes() {
    const duty = this.getCurrentDuty();
    if (!duty?.shiftEnd) return null;

    const shiftEnd = new Date(duty.shiftEnd);
    const now = new Date();
    return Math.floor((shiftEnd - now) / 60000);
  }

  // Check if we should announce a threshold
  checkAndAnnounce() {
    if (!this.enabled) return;

    const duty = this.getCurrentDuty();
    if (!duty) return;

    // Reset announced thresholds if duty changed
    if (duty.code !== this.lastDutyCode) {
      this.announcedThresholds.clear();
      this.lastDutyCode = duty.code;
    }

    const remaining = this.getRemainingMinutes();
    if (remaining === null) return;

    // Check each threshold
    for (const threshold of ANNOUNCEMENT_THRESHOLDS) {
      // Announce when we cross a threshold (within 1 minute window)
      if (remaining <= threshold && remaining > threshold - 1) {
        if (!this.announcedThresholds.has(threshold)) {
          this.announcedThresholds.add(threshold);
          this.announceTimeRemaining(threshold, duty);
          break; // Only announce one at a time
        }
      }
    }
  }

  // Announce time remaining
  announceTimeRemaining(minutes, duty) {
    let message;

    if (minutes === 0) {
      message = `Your ${duty.name} shift has ended. Please complete any pending handovers.`;
    } else if (minutes === 5) {
      message = `5 minutes remaining in your shift. Please prepare for handover.`;
    } else if (minutes === 15) {
      message = `15 minutes remaining in your ${duty.name} shift.`;
    } else if (minutes === 30) {
      message = `30 minutes remaining in your shift.`;
    } else if (minutes === 60) {
      message = `One hour remaining in your ${duty.name} shift.`;
    } else {
      message = `${minutes} minutes remaining in your shift.`;
    }

    this.speak(message);
  }

  // Announce custom message
  announceCustom(message) {
    this.speak(message);
  }

  // Announce duty start
  announceDutyStart(duty) {
    if (!this.enabled) return;
    const message = `Welcome to your ${duty.name} shift. Your shift ends at ${this.formatTime(duty.shiftEnd)}.`;
    this.speak(message);
  }

  // Format time for speech
  formatTime(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'the scheduled time';
    }
  }

  // Start monitoring shift time
  startMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkAndAnnounce();
    }, 60000);

    // Also check immediately
    this.checkAndAnnounce();

    console.log('🔊 Voice announcement monitoring started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.announcedThresholds.clear();
    console.log('🔇 Voice announcement monitoring stopped');
  }

  // Enable/disable announcements
  setEnabled(enabled) {
    this.enabled = enabled;
    this.saveSettings();

    if (enabled) {
      this.initializeVoice();
      this.startMonitoring();
    } else {
      this.stopMonitoring();
      window.speechSynthesis?.cancel();
    }

    console.log(`🔊 Voice announcements: ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Set speech rate (0.5 - 2.0)
  setRate(rate) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
    this.saveSettings();
  }

  // Set volume (0 - 1)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  // Get current settings
  getSettings() {
    return {
      enabled: this.enabled,
      rate: this.rate,
      volume: this.volume,
      voiceName: this.voice?.name || null,
      isSupported: this.isSupported()
    };
  }

  // Test announcement
  testAnnouncement() {
    const wasEnabled = this.enabled;
    this.enabled = true; // Temporarily enable for test

    const result = this.speak('This is a test announcement from Go Barry.');

    if (!wasEnabled) {
      // Re-disable after test completes
      setTimeout(() => {
        this.enabled = wasEnabled;
      }, 3000);
    }

    return result;
  }
}

// Create singleton instance
const voiceAnnouncementService = new VoiceAnnouncementService();

// Initialize on load
if (typeof window !== 'undefined') {
  voiceAnnouncementService.initializeVoice();
}

export default voiceAnnouncementService;
