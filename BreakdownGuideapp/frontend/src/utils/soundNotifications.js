/**
 * Sound Notification System for SDC Dashboard
 * Plays audio alerts for critical breakdowns and status changes
 */

class SoundNotificationManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.5; // 50% volume by default
    this.lastPlayedTimes = new Map(); // Prevent spam
    this.minTimeBetweenSounds = 3000; // 3 seconds minimum between same sound
  }

  /**
   * Initialize audio context (required for browser autoplay policies)
   */
  initialize() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('🔊 Sound notifications initialized');
      } catch (error) {
        console.warn('Sound notifications not supported:', error);
        this.enabled = false;
      }
    }
  }

  /**
   * Play a beep tone using Web Audio API
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in milliseconds
   * @param {string} type - Waveform type ('sine', 'square', 'triangle', 'sawtooth')
   */
  playTone(frequency, duration, type = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration / 1000
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Error playing tone:', error);
    }
  }

  /**
   * Check if enough time has passed since last play
   * @param {string} soundId - Unique identifier for the sound
   * @returns {boolean} - True if sound can be played
   */
  canPlaySound(soundId) {
    const lastPlayed = this.lastPlayedTimes.get(soundId);
    if (!lastPlayed) return true;

    const timeSinceLastPlay = Date.now() - lastPlayed;
    return timeSinceLastPlay >= this.minTimeBetweenSounds;
  }

  /**
   * Record that a sound was played
   * @param {string} soundId - Unique identifier for the sound
   */
  recordSoundPlayed(soundId) {
    this.lastPlayedTimes.set(soundId, Date.now());
  }

  /**
   * Play notification for new critical breakdown
   */
  playNewCriticalBreakdown() {
    if (!this.canPlaySound('critical')) return;

    this.initialize();

    // Play urgent three-tone sequence: high-low-high
    setTimeout(() => this.playTone(880, 150, 'square'), 0);
    setTimeout(() => this.playTone(660, 150, 'square'), 200);
    setTimeout(() => this.playTone(880, 300, 'square'), 400);

    this.recordSoundPlayed('critical');
    console.log('🚨 Critical breakdown alert sound played');
  }

  /**
   * Play notification for new breakdown (non-critical)
   */
  playNewBreakdown() {
    if (!this.canPlaySound('new')) return;

    this.initialize();

    // Play gentle two-tone sequence
    setTimeout(() => this.playTone(523, 150, 'sine'), 0);
    setTimeout(() => this.playTone(659, 150, 'sine'), 200);

    this.recordSoundPlayed('new');
    console.log('🔔 New breakdown alert sound played');
  }

  /**
   * Play notification for SLA warning (75% threshold)
   */
  playSLAWarning() {
    if (!this.canPlaySound('sla_warning')) return;

    this.initialize();

    // Play warning tone: steady beep
    this.playTone(700, 300, 'triangle');

    this.recordSoundPlayed('sla_warning');
    console.log('⚠️ SLA warning sound played');
  }

  /**
   * Play notification for SLA breach
   */
  playSLABreach() {
    if (!this.canPlaySound('sla_breach')) return;

    this.initialize();

    // Play urgent repeating tone
    setTimeout(() => this.playTone(800, 150, 'sawtooth'), 0);
    setTimeout(() => this.playTone(800, 150, 'sawtooth'), 250);
    setTimeout(() => this.playTone(800, 150, 'sawtooth'), 500);

    this.recordSoundPlayed('sla_breach');
    console.log('🚨 SLA breach alert sound played');
  }

  /**
   * Play notification for completed assessment
   */
  playAssessmentComplete() {
    if (!this.canPlaySound('complete')) return;

    this.initialize();

    // Play success chime: ascending tones
    setTimeout(() => this.playTone(523, 100, 'sine'), 0);
    setTimeout(() => this.playTone(659, 100, 'sine'), 120);
    setTimeout(() => this.playTone(784, 200, 'sine'), 240);

    this.recordSoundPlayed('complete');
    console.log('✅ Assessment complete sound played');
  }

  /**
   * Play notification for engineering requested
   */
  playEngineeringRequested() {
    if (!this.canPlaySound('engineering')) return;

    this.initialize();

    // Play notification tone
    this.playTone(600, 200, 'sine');

    this.recordSoundPlayed('engineering');
    console.log('🔧 Engineering request sound played');
  }

  /**
   * Set volume (0.0 to 1.0)
   * @param {number} volume - Volume level
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('sdcSoundVolume', this.volume.toString());
    console.log(`🔊 Sound volume set to ${Math.round(this.volume * 100)}%`);
  }

  /**
   * Enable sound notifications
   */
  enable() {
    this.enabled = true;
    localStorage.setItem('sdcSoundEnabled', 'true');
    console.log('🔊 Sound notifications enabled');
  }

  /**
   * Disable sound notifications
   */
  disable() {
    this.enabled = false;
    localStorage.setItem('sdcSoundEnabled', 'false');
    console.log('🔇 Sound notifications disabled');
  }

  /**
   * Toggle sound notifications
   * @returns {boolean} - New enabled state
   */
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('sdcSoundEnabled', this.enabled.toString());
    console.log(`🔊 Sound notifications ${this.enabled ? 'enabled' : 'disabled'}`);
    return this.enabled;
  }

  /**
   * Load saved preferences
   */
  loadPreferences() {
    const savedEnabled = localStorage.getItem('sdcSoundEnabled');
    const savedVolume = localStorage.getItem('sdcSoundVolume');

    if (savedEnabled !== null) {
      this.enabled = savedEnabled === 'true';
    }

    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }

    console.log('🔊 Sound preferences loaded:', {
      enabled: this.enabled,
      volume: this.volume
    });
  }
}

// Create singleton instance
const soundManager = new SoundNotificationManager();

// Load preferences on initialization
if (typeof window !== 'undefined') {
  soundManager.loadPreferences();
}

export default soundManager;

// Export individual functions for convenience
export const {
  playNewCriticalBreakdown,
  playNewBreakdown,
  playSLAWarning,
  playSLABreach,
  playAssessmentComplete,
  playEngineeringRequested,
  setVolume,
  enable,
  disable,
  toggle
} = soundManager;
