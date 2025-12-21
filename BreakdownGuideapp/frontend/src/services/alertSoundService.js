/**
 * Alert Sound Service
 * Manages audio notifications for SDC Operations Dashboard
 * Supports STOP, AMBER, and SLA breach alerts with user-controlled toggle
 */

class AlertSoundService {
  constructor() {
    this.enabled = this.loadPreference();
    this.audioContext = null;
    this.lastPlayedTime = {};
    this.minIntervalMs = 3000; // Minimum 3 seconds between same alert type
  }

  // Load user preference from localStorage
  loadPreference() {
    try {
      const stored = localStorage.getItem('sdc_sound_alerts');
      return stored !== null ? JSON.parse(stored) : true; // Default to enabled
    } catch {
      return true;
    }
  }

  // Save user preference
  savePreference(enabled) {
    try {
      localStorage.setItem('sdc_sound_alerts', JSON.stringify(enabled));
      this.enabled = enabled;
    } catch (e) {
      console.warn('Failed to save sound preference:', e);
    }
  }

  // Toggle sound on/off
  toggle() {
    this.savePreference(!this.enabled);
    return this.enabled;
  }

  // Check if sound is enabled
  isEnabled() {
    return this.enabled;
  }

  // Initialize audio context (must be called after user interaction)
  initializeAudio() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported:', e);
      }
    }
    return this.audioContext;
  }

  // Check if we can play (rate limiting)
  canPlay(alertType) {
    const now = Date.now();
    const lastPlayed = this.lastPlayedTime[alertType] || 0;
    if (now - lastPlayed < this.minIntervalMs) {
      return false;
    }
    this.lastPlayedTime[alertType] = now;
    return true;
  }

  // Generate and play a tone using Web Audio API
  playTone(frequency, duration, waveType = 'sine', volume = 0.5) {
    if (!this.enabled) return;

    try {
      const ctx = this.initializeAudio();
      if (!ctx) return;

      // Resume audio context if suspended
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = waveType;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Fade in/out to avoid clicks
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Failed to play alert tone:', e);
    }
  }

  // STOP Alert - Urgent, attention-grabbing
  playStopAlert() {
    if (!this.canPlay('stop')) return;

    console.log('🔊 Playing STOP alert');
    // Three ascending tones
    this.playTone(440, 0.15, 'square', 0.4);
    setTimeout(() => this.playTone(554, 0.15, 'square', 0.4), 150);
    setTimeout(() => this.playTone(659, 0.2, 'square', 0.5), 300);
  }

  // AMBER Alert - Warning, softer
  playAmberAlert() {
    if (!this.canPlay('amber')) return;

    console.log('🔊 Playing AMBER alert');
    // Two gentle tones
    this.playTone(523, 0.2, 'sine', 0.3);
    setTimeout(() => this.playTone(659, 0.3, 'sine', 0.25), 200);
  }

  // New Breakdown Alert - General notification
  playNewBreakdownAlert() {
    if (!this.canPlay('new')) return;

    console.log('🔊 Playing new breakdown alert');
    // Single notification chime
    this.playTone(880, 0.3, 'sine', 0.2);
  }

  // SLA Breach Warning - Escalating
  playSlaBreachAlert() {
    if (!this.canPlay('sla')) return;

    console.log('🔊 Playing SLA breach alert');
    // Escalating beeps
    this.playTone(330, 0.1, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(440, 0.1, 'sawtooth', 0.35), 150);
    setTimeout(() => this.playTone(550, 0.1, 'sawtooth', 0.4), 300);
    setTimeout(() => this.playTone(660, 0.15, 'sawtooth', 0.45), 450);
  }

  // Play appropriate alert based on severity
  playAlertForSeverity(severity) {
    switch (severity?.toUpperCase()) {
      case 'STOP':
        this.playStopAlert();
        break;
      case 'AMBER':
        this.playAmberAlert();
        break;
      default:
        this.playNewBreakdownAlert();
    }
  }

  // Request browser notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Show browser notification
  showNotification(title, body, severity) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const icon = severity === 'STOP' ? '/stop-icon.png' :
                   severity === 'AMBER' ? '/amber-icon.png' : '/breakdown-icon.png';

      const notification = new Notification(title, {
        body,
        icon,
        tag: 'sdc-breakdown',
        requireInteraction: severity === 'STOP'
      });

      // Auto-close after 10 seconds (except for STOP)
      if (severity !== 'STOP') {
        setTimeout(() => notification.close(), 10000);
      }

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }
    return null;
  }
}

// Export singleton instance
export const alertSoundService = new AlertSoundService();

export default alertSoundService;
