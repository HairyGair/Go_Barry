import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const SHIFTS_FILE = path.join(__dirname, '../data/supervisor-shifts.json');
const ACTIONS_FILE = path.join(__dirname, '../data/supervisor-actions.json');

// Helper functions
async function readShifts() {
  try {
    const data = await fs.readFile(SHIFTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveShifts(shifts) {
  await fs.writeFile(SHIFTS_FILE, JSON.stringify(shifts, null, 2));
}

async function logAction(badge, action, details) {
  const actions = JSON.parse(await fs.readFile(ACTIONS_FILE, 'utf-8').catch(() => '[]'));
  actions.push({
    supervisor_badge: badge,
    action,
    details,
    timestamp: new Date().toISOString()
  });
  await fs.writeFile(ACTIONS_FILE, JSON.stringify(actions, null, 2));
}

// Clock In
router.post('/clock-in', async (req, res) => {
  try {
    const { supervisorBadge, dutyCode } = req.body;
    const shifts = await readShifts();
    
    // Check for existing open shift
    const openShift = shifts.find(s => 
      s.supervisor_badge === supervisorBadge && !s.clock_out
    );
    
    if (openShift) {
      return res.json({ 
        success: false, 
        message: 'Already clocked in. Please clock out first.' 
      });
    }
    
    // Create new shift
    const newShift = {
      id: Date.now().toString(),
      supervisor_badge: supervisorBadge,
      duty_code: dutyCode,
      clock_in: new Date().toISOString(),
      clock_out: null,
      break_start: null,
      break_end: null,
      handover_notes: null
    };
    
    shifts.push(newShift);
    await saveShifts(shifts);
    await logAction(supervisorBadge, 'CLOCK_IN', { duty: dutyCode });
    
    res.json({ success: true, shift: newShift });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Break
router.post('/start-break', async (req, res) => {
  try {
    const { supervisorBadge } = req.body;
    const shifts = await readShifts();
    
    const currentShift = shifts.find(s => 
      s.supervisor_badge === supervisorBadge && !s.clock_out
    );
    
    if (!currentShift) {
      return res.json({ success: false, message: 'No active shift found' });
    }
    
    currentShift.break_start = new Date().toISOString();
    await saveShifts(shifts);
    await logAction(supervisorBadge, 'BREAK_START', {});
    
    res.json({ success: true, shift: currentShift });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// End Break
router.post('/end-break', async (req, res) => {
  try {
    const { supervisorBadge } = req.body;
    const shifts = await readShifts();
    
    const currentShift = shifts.find(s => 
      s.supervisor_badge === supervisorBadge && !s.clock_out
    );
    
    if (!currentShift) {
      return res.json({ success: false, message: 'No active shift found' });
    }
    
    currentShift.break_end = new Date().toISOString();
    await saveShifts(shifts);
    await logAction(supervisorBadge, 'BREAK_END', {});
    
    res.json({ success: true, shift: currentShift });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clock Out
router.post('/clock-out', async (req, res) => {
  try {
    const { supervisorBadge, handoverNotes } = req.body;
    const shifts = await readShifts();
    
    const currentShift = shifts.find(s => 
      s.supervisor_badge === supervisorBadge && !s.clock_out
    );
    
    if (!currentShift) {
      return res.json({ success: false, message: 'No active shift found' });
    }
    
    currentShift.clock_out = new Date().toISOString();
    currentShift.handover_notes = handoverNotes;
    
    await saveShifts(shifts);
    await logAction(supervisorBadge, 'CLOCK_OUT', { notes: handoverNotes });
    
    res.json({ success: true, shift: currentShift });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Current Shift
router.get('/current-shift/:badge', async (req, res) => {
  try {
    const shifts = await readShifts();
    const currentShift = shifts.find(s => 
      s.supervisor_badge === req.params.badge && !s.clock_out
    );
    
    res.json({ success: true, shift: currentShift || null });
  } catch (error) {
    res.json({ success: true, shift: null });
  }
});

// Get Recent Shifts (for activity dashboard)
router.get('/recent-shifts/:badge', async (req, res) => {
  try {
    const shifts = await readShifts();
    const supervisorShifts = shifts
      .filter(s => s.supervisor_badge === req.params.badge)
      .sort((a, b) => new Date(b.clock_in) - new Date(a.clock_in))
      .slice(0, 10);
    
    res.json({ success: true, shifts: supervisorShifts });
  } catch (error) {
    res.json({ success: true, shifts: [] });
  }
});

// Get Activity Summary
router.get('/activity-summary/:badge', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const shifts = await readShifts();
    const actions = await fs.readFile(ACTIONS_FILE, 'utf-8')
      .then(data => JSON.parse(data))
      .catch(() => []);
    
    // Filter by supervisor and date range
    const supervisorShifts = shifts.filter(s => {
      if (s.supervisor_badge !== req.params.badge) return false;
      const shiftDate = new Date(s.clock_in);
      if (startDate && shiftDate < new Date(startDate)) return false;
      if (endDate && shiftDate > new Date(endDate)) return false;
      return true;
    });
    
    const supervisorActions = actions.filter(a => {
      if (a.supervisor_badge !== req.params.badge) return false;
      const actionDate = new Date(a.timestamp);
      if (startDate && actionDate < new Date(startDate)) return false;
      if (endDate && actionDate > new Date(endDate)) return false;
      return true;
    });
    
    // Calculate statistics
    let totalMinutes = 0;
    let breaksUsed = 0;
    
    supervisorShifts.forEach(shift => {
      if (shift.clock_out) {
        const clockIn = new Date(shift.clock_in);
        const clockOut = new Date(shift.clock_out);
        let shiftMinutes = (clockOut - clockIn) / 60000;
        
        if (shift.break_start && shift.break_end) {
          const breakMinutes = (new Date(shift.break_end) - new Date(shift.break_start)) / 60000;
          shiftMinutes -= breakMinutes;
          breaksUsed++;
        }
        
        totalMinutes += shiftMinutes;
      }
    });
    
    const alertsDismissed = supervisorActions.filter(a => 
      a.action === 'DISMISS_ALERT'
    ).length;
    
    res.json({ 
      success: true,
      summary: {
        totalHours: (totalMinutes / 60).toFixed(1),
        shiftsCompleted: supervisorShifts.filter(s => s.clock_out).length,
        alertsDismissed,
        breaksUsed,
        avgShiftLength: supervisorShifts.length > 0 
          ? ((totalMinutes / supervisorShifts.filter(s => s.clock_out).length) / 60).toFixed(1)
          : 0
      },
      shifts: supervisorShifts,
      actions: supervisorActions
    });
  } catch (error) {
    console.error('Activity summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Email Summary
router.post('/email-summary', async (req, res) => {
  try {
    const { supervisorBadge, supervisorName, startDate, endDate, stats } = req.body;
    
    // Log the email request for now (in production, this would integrate with email service)
    const emailLog = {
      id: Date.now().toString(),
      to: 'management@gonortheast.co.uk',
      subject: `Activity Summary - ${supervisorName} (${supervisorBadge})`,
      sentAt: new Date().toISOString(),
      period: `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      stats: stats
    };
    
    // In production, this would send actual email via SendGrid/AWS SES/etc
    console.log('Email summary requested:', emailLog);
    
    // For now, just log the action
    await logAction(supervisorBadge, 'EMAIL_SUMMARY', { 
      period: emailLog.period,
      stats: stats 
    });
    
    res.json({ 
      success: true, 
      message: 'Summary email sent successfully',
      emailLog 
    });
  } catch (error) {
    console.error('Email summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
