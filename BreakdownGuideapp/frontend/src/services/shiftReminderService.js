/**
 * Shift Reminder Service
 *
 * Phase 4.1 - Browser push notifications for shift reminders
 *
 * Features:
 * - Request notification permission
 * - Schedule reminders for configured shifts
 * - 15-minute warning before shift start
 * - Persist preferences in localStorage
 * - Handle notification clicks
 */

// Shift definitions
const SHIFTS = {
  '100': { name: 'Early Shift', start: '06:00', end: '15:30', icon: '🌅' },
  '200': { name: 'Day Shift', start: '07:30', end: '17:00', icon: '☀️' },
  '400': { name: 'Late Shift', start: '12:30', end: '22:00', icon: '🌆' },
  '500': { name: 'Night Shift', start: '14:45', end: '00:15', icon: '🌙' }
};

// Default preferences
const DEFAULT_PREFERENCES = {
  enabled: false,
  reminderMinutes: 15,
  shifts: [], // Array of shift codes the user works
  sound: true,
  vibrate: true
};

// Storage key
const STORAGE_KEY = 'shiftReminderPreferences';

class ShiftReminderService {
  constructor() {
    this.preferences = this.loadPreferences();
    this.checkInterval = null;
    this.lastNotifiedShift = null;
    this.lastNotifiedDate = null;
  }

  /**
   * Load preferences from localStorage
   */
  loadPreferences() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error loading shift reminder preferences:', e);
    }
    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Save preferences to localStorage
   */
  savePreferences(prefs) {
    try {
      this.preferences = { ...this.preferences, ...prefs };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));

      // Restart monitoring if preferences changed
      if (this.preferences.enabled) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }

      return true;
    } catch (e) {
      console.error('Error saving shift reminder preferences:', e);
      return false;
    }
  }

  /**
   * Get current preferences
   */
  getPreferences() {
    return { ...this.preferences };
  }

  /**
   * Get all available shifts
   */
  getShifts() {
    return { ...SHIFTS };
  }

  /**
   * Check if browser supports notifications
   */
  isSupported() {
    return 'Notification' in window;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!this.isSupported()) {
      return { success: false, status: 'unsupported', message: 'Browser does not support notifications' };
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        return { success: true, status: 'granted', message: 'Notifications enabled' };
      } else if (permission === 'denied') {
        return { success: false, status: 'denied', message: 'Notifications blocked by user' };
      } else {
        return { success: false, status: 'default', message: 'Permission not yet granted' };
      }
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return { success: false, status: 'error', message: e.message };
    }
  }

  /**
   * Send a test notification
   */
  async sendTestNotification() {
    if (!this.isSupported()) {
      return { success: false, message: 'Notifications not supported' };
    }

    if (Notification.permission !== 'granted') {
      const result = await this.requestPermission();
      if (!result.success) return result;
    }

    try {
      const notification = new Notification('Go BARRY - Test Notification', {
        body: 'Shift reminders are working! You will be notified 15 minutes before your shift starts.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'shift-reminder-test',
        requireInteraction: false,
        silent: !this.preferences.sound
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);

      return { success: true, message: 'Test notification sent' };
    } catch (e) {
      console.error('Error sending test notification:', e);
      return { success: false, message: e.message };
    }
  }

  /**
   * Send shift reminder notification
   */
  async sendShiftReminder(shiftCode, minutesUntilStart) {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    const shift = SHIFTS[shiftCode];
    if (!shift) return false;

    try {
      const notification = new Notification(`${shift.icon} Shift Starting Soon`, {
        body: `Your ${shift.name} (Duty ${shiftCode}) starts in ${minutesUntilStart} minutes at ${shift.start}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `shift-reminder-${shiftCode}`,
        requireInteraction: true,
        silent: !this.preferences.sound,
        vibrate: this.preferences.vibrate ? [200, 100, 200] : undefined,
        actions: [
          { action: 'login', title: 'Open Go BARRY' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        window.location.href = '/';
        notification.close();
      };

      // Track that we've notified for this shift today
      this.lastNotifiedShift = shiftCode;
      this.lastNotifiedDate = new Date().toDateString();

      return true;
    } catch (e) {
      console.error('Error sending shift reminder:', e);
      return false;
    }
  }

  /**
   * Check if a shift reminder should be sent
   */
  checkShiftReminders() {
    if (!this.preferences.enabled || this.preferences.shifts.length === 0) {
      return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const today = now.toDateString();

    for (const shiftCode of this.preferences.shifts) {
      const shift = SHIFTS[shiftCode];
      if (!shift) continue;

      // Parse shift start time
      const [startHour, startMin] = shift.start.split(':').map(Number);
      const shiftStartMinutes = startHour * 60 + startMin;

      // Calculate minutes until shift starts
      let minutesUntilStart = shiftStartMinutes - currentMinutes;

      // Handle next day (for checking evening before early shift)
      if (minutesUntilStart < -60) {
        minutesUntilStart += 24 * 60;
      }

      // Check if we should notify (within reminder window and not already notified today)
      const reminderWindow = this.preferences.reminderMinutes;

      if (
        minutesUntilStart > 0 &&
        minutesUntilStart <= reminderWindow &&
        !(this.lastNotifiedShift === shiftCode && this.lastNotifiedDate === today)
      ) {
        console.log(`🔔 Shift reminder: ${shift.name} starts in ${minutesUntilStart} minutes`);
        this.sendShiftReminder(shiftCode, minutesUntilStart);
      }
    }
  }

  /**
   * Start monitoring for shift reminders
   */
  startMonitoring() {
    // Clear existing interval
    this.stopMonitoring();

    if (!this.preferences.enabled || this.preferences.shifts.length === 0) {
      console.log('⏸️ Shift reminders disabled or no shifts configured');
      return;
    }

    console.log('▶️ Starting shift reminder monitoring for shifts:', this.preferences.shifts);

    // Check immediately
    this.checkShiftReminders();

    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkShiftReminders();
    }, 60000);
  }

  /**
   * Stop monitoring for shift reminders
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏹️ Stopped shift reminder monitoring');
    }
  }

  /**
   * Initialize the service (call on app load)
   */
  initialize() {
    if (this.preferences.enabled && this.preferences.shifts.length > 0) {
      this.startMonitoring();
    }
  }

  /**
   * Get next upcoming shift for user
   */
  getNextShift() {
    if (this.preferences.shifts.length === 0) {
      return null;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let closestShift = null;
    let closestMinutes = Infinity;

    for (const shiftCode of this.preferences.shifts) {
      const shift = SHIFTS[shiftCode];
      if (!shift) continue;

      const [startHour, startMin] = shift.start.split(':').map(Number);
      let shiftStartMinutes = startHour * 60 + startMin;

      // Calculate minutes until shift
      let minutesUntil = shiftStartMinutes - currentMinutes;
      if (minutesUntil < 0) {
        minutesUntil += 24 * 60; // Next day
      }

      if (minutesUntil < closestMinutes) {
        closestMinutes = minutesUntil;
        closestShift = {
          code: shiftCode,
          ...shift,
          minutesUntil,
          startsToday: minutesUntil === (shiftStartMinutes - currentMinutes)
        };
      }
    }

    return closestShift;
  }
}

// Singleton instance
const shiftReminderService = new ShiftReminderService();

export default shiftReminderService;
export { SHIFTS };
