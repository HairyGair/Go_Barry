/**
 * Breakdown Assignment Service
 * Phase 7.1: Auto-assign breakdowns to on-duty supervisors
 *
 * Features:
 * - Find supervisors currently on duty
 * - Match by depot/availability
 * - Round-robin assignment to balance workload
 * - Activity logging for assignments
 */

import { query } from '../utils/queryHelpers.js';
import { activityLogger } from './activityLogger.js';

class BreakdownAssignmentService {
  constructor() {
    // Track recent assignments for round-robin balancing
    this.recentAssignments = new Map();

    // Duty shift definitions (match frontend)
    this.DUTY_SHIFTS = {
      '100': { name: 'Early Shift', start: '06:00', end: '15:30' },
      '200': { name: 'Day Shift', start: '07:30', end: '17:00' },
      '400': { name: 'Late Shift', start: '12:30', end: '22:00' },
      '500': { name: 'Night Shift', start: '14:45', end: '00:15' }
    };
  }

  /**
   * Get currently active duty codes based on current time
   */
  getActiveDutyCodes() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const activeDuties = [];

    for (const [code, shift] of Object.entries(this.DUTY_SHIFTS)) {
      const [startH, startM] = shift.start.split(':').map(Number);
      const [endH, endM] = shift.end.split(':').map(Number);

      let startMinutes = startH * 60 + startM;
      let endMinutes = endH * 60 + endM;

      // Handle overnight shifts (end time < start time)
      if (endMinutes < startMinutes) {
        // Shift crosses midnight
        if (currentTime >= startMinutes || currentTime < endMinutes) {
          activeDuties.push(code);
        }
      } else {
        // Normal shift
        if (currentTime >= startMinutes && currentTime < endMinutes) {
          activeDuties.push(code);
        }
      }
    }

    return activeDuties;
  }

  /**
   * Find supervisors currently on duty
   * @param {string} depot - Optional depot filter
   * @returns {Promise<Array>} List of on-duty supervisors
   */
  async getOnDutySupervisors(depot = null) {
    try {
      const activeDutyCodes = this.getActiveDutyCodes();

      if (activeDutyCodes.length === 0) {
        console.log('No active duty shifts at current time');
        return [];
      }

      // Query supervisors with active duty
      let sql = `
        SELECT
          id,
          name,
          badge_number,
          depot,
          current_duty,
          duty_start_time,
          email
        FROM supervisors
        WHERE is_active = 1
          AND current_duty IS NOT NULL
          AND current_duty IN (${activeDutyCodes.map(() => '?').join(',')})
      `;
      const params = [...activeDutyCodes];

      // Filter by depot if specified
      if (depot && depot !== 'Unknown') {
        sql += ' AND depot = ?';
        params.push(depot);
      }

      sql += ' ORDER BY duty_start_time ASC';

      const supervisors = await query(sql, params);

      console.log(`Found ${supervisors.length} on-duty supervisor(s)${depot ? ` for depot ${depot}` : ''}`);
      return supervisors;

    } catch (error) {
      console.error('Error fetching on-duty supervisors:', error);
      return [];
    }
  }

  /**
   * Get supervisor's current workload (active breakdowns)
   * @param {string} supervisorId - Supervisor ID
   * @returns {Promise<number>} Number of active breakdowns
   */
  async getSupervisorWorkload(supervisorId) {
    try {
      const result = await query(`
        SELECT COUNT(*) as count
        FROM breakdowns
        WHERE assigned_supervisor_id = ?
          AND status NOT IN ('resolved', 'cleared', 'completed')
      `, [supervisorId]);

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting supervisor workload:', error);
      return 0;
    }
  }

  /**
   * Select best supervisor for assignment based on workload
   * @param {Array} supervisors - List of available supervisors
   * @returns {Promise<Object|null>} Selected supervisor or null
   */
  async selectBestSupervisor(supervisors) {
    if (!supervisors || supervisors.length === 0) {
      return null;
    }

    // If only one supervisor, return them
    if (supervisors.length === 1) {
      return supervisors[0];
    }

    // Get workload for each supervisor
    const supervisorsWithWorkload = await Promise.all(
      supervisors.map(async (sup) => ({
        ...sup,
        workload: await this.getSupervisorWorkload(sup.id)
      }))
    );

    // Sort by workload (ascending) - prefer supervisors with fewer active breakdowns
    supervisorsWithWorkload.sort((a, b) => a.workload - b.workload);

    // Return supervisor with lowest workload
    const selected = supervisorsWithWorkload[0];
    console.log(`Selected supervisor ${selected.name} (${selected.badge_number}) with ${selected.workload} active breakdown(s)`);

    return selected;
  }

  /**
   * Auto-assign a breakdown to an on-duty supervisor
   * @param {Object} breakdown - Breakdown data
   * @param {Object} options - Assignment options
   * @returns {Promise<Object>} Assignment result
   */
  async autoAssignBreakdown(breakdown, options = {}) {
    const {
      breakdownId,
      fleetNo,
      depot,
      severity,
      issueCategory,
      location
    } = breakdown;

    const {
      preferSameDepot = true,
      notifySupervisor = true
    } = options;

    try {
      console.log(`\n🔄 Auto-assigning breakdown ${breakdownId}...`);

      // Step 1: Find on-duty supervisors (same depot first)
      let supervisors = [];

      if (preferSameDepot && depot && depot !== 'Unknown') {
        supervisors = await this.getOnDutySupervisors(depot);
      }

      // Step 2: If no depot-specific supervisors, try all on-duty
      if (supervisors.length === 0) {
        console.log('No on-duty supervisors in depot, checking all depots...');
        supervisors = await this.getOnDutySupervisors(null);
      }

      // Step 3: If still no supervisors, return unassigned
      if (supervisors.length === 0) {
        console.log('⚠️ No on-duty supervisors available for assignment');
        return {
          success: false,
          assigned: false,
          reason: 'No on-duty supervisors available',
          breakdownId
        };
      }

      // Step 4: Select best supervisor based on workload
      const selectedSupervisor = await this.selectBestSupervisor(supervisors);

      if (!selectedSupervisor) {
        return {
          success: false,
          assigned: false,
          reason: 'Failed to select supervisor',
          breakdownId
        };
      }

      // Step 5: Update breakdown with assignment
      await query(`
        UPDATE breakdowns
        SET
          assigned_supervisor_id = ?,
          assigned_supervisor_name = ?,
          assigned_supervisor_badge = ?,
          assigned_at = NOW(),
          updated_at = NOW()
        WHERE breakdown_id = ?
      `, [
        selectedSupervisor.id,
        selectedSupervisor.name,
        selectedSupervisor.badge_number,
        breakdownId
      ]);

      console.log(`✅ Breakdown ${breakdownId} assigned to ${selectedSupervisor.name}`);

      // Step 6: Log assignment activity
      try {
        await activityLogger.log({
          activity_type: 'breakdown_assigned',
          entity_type: 'breakdown',
          entity_id: breakdownId,
          actor_id: 'system',
          actor_name: 'Auto-Assignment',
          action: `assigned to ${selectedSupervisor.name}`,
          message: `Breakdown ${breakdownId} auto-assigned to ${selectedSupervisor.name} (${selectedSupervisor.badge_number})`,
          severity: severity || 'NORMAL',
          depot: depot || selectedSupervisor.depot,
          metadata: {
            assigned_supervisor_id: selectedSupervisor.id,
            assigned_supervisor_name: selectedSupervisor.name,
            assigned_supervisor_badge: selectedSupervisor.badge_number,
            assignment_method: 'auto',
            fleet_no: fleetNo,
            issue_category: issueCategory
          }
        });
      } catch (logError) {
        console.error('Failed to log assignment activity:', logError);
      }

      return {
        success: true,
        assigned: true,
        supervisor: {
          id: selectedSupervisor.id,
          name: selectedSupervisor.name,
          badge_number: selectedSupervisor.badge_number,
          depot: selectedSupervisor.depot,
          duty: selectedSupervisor.current_duty
        },
        breakdownId,
        assignedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error auto-assigning breakdown:', error);
      return {
        success: false,
        assigned: false,
        reason: error.message,
        breakdownId
      };
    }
  }

  /**
   * Manually assign a breakdown to a specific supervisor
   * @param {string} breakdownId - Breakdown ID
   * @param {string} supervisorId - Supervisor ID to assign to
   * @param {string} assignedBy - Admin who made the assignment
   * @returns {Promise<Object>} Assignment result
   */
  async manualAssignBreakdown(breakdownId, supervisorId, assignedBy) {
    try {
      // Get supervisor details
      const supervisors = await query(
        'SELECT id, name, badge_number, depot, current_duty FROM supervisors WHERE id = ?',
        [supervisorId]
      );

      if (!supervisors || supervisors.length === 0) {
        return {
          success: false,
          error: 'Supervisor not found'
        };
      }

      const supervisor = supervisors[0];

      // Update breakdown
      await query(`
        UPDATE breakdowns
        SET
          assigned_supervisor_id = ?,
          assigned_supervisor_name = ?,
          assigned_supervisor_badge = ?,
          assigned_at = NOW(),
          updated_at = NOW()
        WHERE breakdown_id = ?
      `, [
        supervisor.id,
        supervisor.name,
        supervisor.badge_number,
        breakdownId
      ]);

      // Log activity
      await activityLogger.log({
        activity_type: 'breakdown_assigned',
        entity_type: 'breakdown',
        entity_id: breakdownId,
        actor_id: assignedBy,
        actor_name: 'Admin',
        action: `manually assigned to ${supervisor.name}`,
        message: `Breakdown ${breakdownId} manually assigned to ${supervisor.name}`,
        metadata: {
          assigned_supervisor_id: supervisor.id,
          assigned_supervisor_name: supervisor.name,
          assignment_method: 'manual',
          assigned_by: assignedBy
        }
      });

      return {
        success: true,
        assigned: true,
        supervisor: {
          id: supervisor.id,
          name: supervisor.name,
          badge_number: supervisor.badge_number
        },
        breakdownId
      };

    } catch (error) {
      console.error('Error manually assigning breakdown:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get assignment statistics for dashboard
   * @returns {Promise<Object>} Assignment stats
   */
  async getAssignmentStats() {
    try {
      const stats = await query(`
        SELECT
          COUNT(*) as total_active,
          COUNT(assigned_supervisor_id) as assigned,
          COUNT(*) - COUNT(assigned_supervisor_id) as unassigned
        FROM breakdowns
        WHERE status NOT IN ('resolved', 'cleared', 'completed')
      `);

      const bySuper = await query(`
        SELECT
          assigned_supervisor_name as supervisor,
          assigned_supervisor_badge as badge,
          COUNT(*) as count
        FROM breakdowns
        WHERE status NOT IN ('resolved', 'cleared', 'completed')
          AND assigned_supervisor_id IS NOT NULL
        GROUP BY assigned_supervisor_id, assigned_supervisor_name, assigned_supervisor_badge
        ORDER BY count DESC
      `);

      return {
        summary: stats[0] || { total_active: 0, assigned: 0, unassigned: 0 },
        bySupervisor: bySuper
      };

    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return {
        summary: { total_active: 0, assigned: 0, unassigned: 0 },
        bySupervisor: []
      };
    }
  }
}

// Export singleton instance
const breakdownAssignmentService = new BreakdownAssignmentService();
export default breakdownAssignmentService;
