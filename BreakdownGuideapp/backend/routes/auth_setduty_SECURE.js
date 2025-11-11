// SECURE set-duty endpoint with duty locking enforcement
// Replace the existing /api/auth/set-duty endpoint with this secure version

// POST /api/auth/set-duty - Set duty with lock enforcement
router.post('/set-duty', verifyToken, csrfProtection, validate(authSchemas.setDuty), async (req, res) => {
  try {
    const { duty } = req.body;
    const supervisorId = req.user.id;

    // Normalize duty code (remove "Duty " prefix if present)
    const normalizedDuty = duty.replace(/^Duty\s+/i, '');

    // Validate duty code
    const validDutyCodes = ['100', '200', '400', '500'];
    if (!validDutyCodes.includes(normalizedDuty)) {
      return res.status(400).json({
        success: false,
        error: `Invalid duty code. Must be one of: ${validDutyCodes.join(', ')}`,
        code: 'INVALID_DUTY_CODE'
      });
    }

    // Check if duty is already locked
    const [existingSupervisor] = await query(
      'SELECT current_duty, duty_locked_at, duty_locked_by FROM supervisors WHERE id = ?',
      [supervisorId]
    );

    if (!existingSupervisor) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found',
        code: 'SUPERVISOR_NOT_FOUND'
      });
    }

    // Check if duty is locked
    if (existingSupervisor.duty_locked_at && req.user.role !== 'admin') {
      console.warn(`⚠️ Duty change blocked for ${req.user.email} - duty is locked`);

      // Log to audit table
      await query(
        `INSERT INTO supervisor_session_audit
         (supervisor_id, event_type, ip_address, user_agent, created_at)
         VALUES (?, 'duty_change_blocked', ?, ?, NOW())`,
        [supervisorId, req.ip, req.get('User-Agent')]
      );

      return res.status(403).json({
        success: false,
        error: 'Your duty is locked and cannot be changed. Please contact an administrator for assistance.',
        code: 'DUTY_LOCKED',
        lockedAt: existingSupervisor.duty_locked_at,
        lockedBy: existingSupervisor.duty_locked_by
      });
    }

    // Admin override warning
    if (existingSupervisor.duty_locked_at && req.user.role === 'admin') {
      console.warn(`⚠️ ADMIN OVERRIDE: ${req.user.email} changing locked duty from ${existingSupervisor.current_duty} to ${normalizedDuty}`);

      // Log admin override to audit table
      await query(
        `INSERT INTO supervisor_session_audit
         (supervisor_id, event_type, ip_address, user_agent, created_at)
         VALUES (?, 'admin_duty_override', ?, ?, NOW())`,
        [supervisorId, req.ip, req.get('User-Agent')]
      );

      // TODO: Send notification to supervisors about admin override
    }

    // Get supervisor details
    const [supervisor] = await query(
      'SELECT id, name, badge_number, depot FROM supervisors WHERE id = ?',
      [supervisorId]
    );

    // Calculate duty times
    const dutyShifts = {
      '100': { startTime: '06:00', endTime: '15:30' },
      '200': { startTime: '07:30', endTime: '17:00' },
      '400': { startTime: '12:30', endTime: '22:00' },
      '500': { startTime: '14:45', endTime: '00:15', crossesMidnight: true }
    };

    const dutyConfig = dutyShifts[normalizedDuty];
    const now = new Date();
    const [startHours, startMinutes] = dutyConfig.startTime.split(':').map(Number);
    const [endHours, endMinutes] = dutyConfig.endTime.split(':').map(Number);

    const startTime = new Date();
    startTime.setHours(startHours, startMinutes, 0, 0);

    const endTime = new Date();
    endTime.setHours(endHours, endMinutes, 0, 0);

    // Handle shifts that cross midnight
    if (dutyConfig.crossesMidnight || endHours < startHours) {
      if (now.getHours() >= startHours) {
        endTime.setDate(endTime.getDate() + 1);
      }
    }

    // Update supervisor with duty and lock it
    await query(
      `UPDATE supervisors
       SET current_duty = ?,
           duty_start_time = ?,
           duty_end_time = ?,
           duty_locked_at = NOW(),
           duty_locked_by = ?
       WHERE id = ?`,
      [
        normalizedDuty,
        startTime.toISOString().slice(0, 19).replace('T', ' '),
        endTime.toISOString().slice(0, 19).replace('T', ' '),
        req.user.email,
        supervisorId
      ]
    );

    // Update session
    await query(
      `UPDATE supervisor_sessions
       SET current_duty = ?,
           duty_start_time = ?,
           duty_end_time = ?,
           last_activity = NOW()
       WHERE supervisor_id = ? AND is_online = TRUE`,
      [
        normalizedDuty,
        startTime.toISOString().slice(0, 19).replace('T', ' '),
        endTime.toISOString().slice(0, 19).replace('T', ' '),
        supervisorId
      ]
    );

    // Create shift history record
    await query(
      `INSERT INTO supervisor_shift_history
       (supervisor_id, supervisor_name, supervisor_badge, duty, shift_start, shift_end)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        supervisorId,
        supervisor.name,
        supervisor.badge_number,
        normalizedDuty,
        startTime.toISOString().slice(0, 19).replace('T', ' '),
        endTime.toISOString().slice(0, 19).replace('T', ' ')
      ]
    );

    // Log successful duty change
    await query(
      `INSERT INTO supervisor_session_audit
       (supervisor_id, event_type, ip_address, user_agent, created_at)
       VALUES (?, 'duty_changed', ?, ?, NOW())`,
      [supervisorId, req.ip, req.get('User-Agent')]
    );

    console.log(`✅ Duty set and locked: ${supervisor.name} -> Duty ${normalizedDuty}`);

    res.json({
      success: true,
      duty: normalizedDuty,
      displayName: `Duty ${normalizedDuty}`,
      locked: true,
      lockedAt: new Date().toISOString(),
      lockedBy: req.user.email,
      shiftInfo: {
        duty: normalizedDuty,
        shiftStart: startTime.toISOString(),
        shiftEnd: endTime.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Set duty error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set duty',
      code: 'SET_DUTY_ERROR'
    });
  }
});

// POST /api/auth/unlock-duty - Admin endpoint to unlock a supervisor's duty
router.post('/unlock-duty', verifyToken, csrfProtection, requireAdmin, async (req, res) => {
  try {
    const { supervisorId } = req.body;

    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID is required',
        code: 'MISSING_SUPERVISOR_ID'
      });
    }

    // Unlock the duty
    await query(
      `UPDATE supervisors
       SET duty_locked_at = NULL,
           duty_locked_by = NULL
       WHERE id = ?`,
      [supervisorId]
    );

    // Log the unlock action
    await query(
      `INSERT INTO supervisor_session_audit
       (supervisor_id, event_type, ip_address, user_agent, created_at)
       VALUES (?, 'duty_unlocked', ?, ?, NOW())`,
      [supervisorId, req.ip, req.get('User-Agent')]
    );

    console.log(`✅ Duty unlocked for supervisor ${supervisorId} by admin ${req.user.email}`);

    res.json({
      success: true,
      message: 'Duty unlocked successfully'
    });

  } catch (error) {
    console.error('❌ Unlock duty error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlock duty',
      code: 'UNLOCK_DUTY_ERROR'
    });
  }
});