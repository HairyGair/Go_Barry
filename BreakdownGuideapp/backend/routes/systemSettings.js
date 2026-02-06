/**
 * System Settings Routes
 * Phase 9.1: Mandatory Duty Selection & Compliance Settings
 *
 * Endpoints:
 * - GET /api/settings - Get all settings (admin only)
 * - GET /api/settings/:key - Get specific setting
 * - PUT /api/settings/:key - Update setting (admin only)
 * - GET /api/settings/compliance/status - Get compliance settings for frontend
 */

import express from 'express';
import pool from '../config/mysql.js';
import { activityLogger, ACTIVITY_TYPES, ACTOR_TYPES, ENTITY_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';

const router = express.Router();

// =====================================================
// GET ALL SETTINGS (Admin Only)
// =====================================================
router.get('/', async (req, res) => {
    try {
        // Check admin access
        const userRole = req.user?.role || req.headers['x-user-role'];
        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        const settings = await pool.query(`
            SELECT
                setting_key,
                setting_value,
                setting_type,
                description,
                updated_by,
                updated_at
            FROM system_settings
            ORDER BY setting_key
        `);

        // Parse values based on type
        const parsedSettings = settings.map(s => ({
            ...s,
            parsed_value: parseSettingValue(s.setting_value, s.setting_type)
        }));

        res.json({
            success: true,
            settings: parsedSettings,
            count: settings.length
        });

    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch settings'
        });
    }
});

// =====================================================
// GET COMPLIANCE STATUS (Public - for frontend checks)
// =====================================================
router.get('/compliance/status', async (req, res) => {
    try {
        const settings = await pool.query(`
            SELECT setting_key, setting_value, setting_type
            FROM system_settings
            WHERE setting_key IN (
                'mandatory_duty_selection',
                'duty_selection_grace_period_minutes',
                'session_timeout_minutes',
                'session_timeout_warning_minutes'
            )
        `);

        // Convert to object
        const compliance = {};
        settings.forEach(s => {
            compliance[s.setting_key] = parseSettingValue(s.setting_value, s.setting_type);
        });

        res.json({
            success: true,
            compliance: {
                mandatoryDutySelection: compliance.mandatory_duty_selection || false,
                gracePeriodMinutes: compliance.duty_selection_grace_period_minutes || 5,
                sessionTimeoutMinutes: compliance.session_timeout_minutes || 480,
                sessionTimeoutWarningMinutes: compliance.session_timeout_warning_minutes || 30
            }
        });

    } catch (error) {
        console.error('Error fetching compliance status:', error);
        // Return defaults on error
        res.json({
            success: true,
            compliance: {
                mandatoryDutySelection: false,
                gracePeriodMinutes: 5,
                sessionTimeoutMinutes: 480,
                sessionTimeoutWarningMinutes: 30
            }
        });
    }
});

// =====================================================
// GET SINGLE SETTING
// =====================================================
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;

        const settings = await pool.query(`
            SELECT
                setting_key,
                setting_value,
                setting_type,
                description,
                updated_by,
                updated_at
            FROM system_settings
            WHERE setting_key = ?
        `, [key]);

        if (settings.length === 0) {
            return res.status(404).json({
                success: false,
                error: `Setting '${key}' not found`
            });
        }

        const setting = settings[0];
        res.json({
            success: true,
            setting: {
                ...setting,
                parsed_value: parseSettingValue(setting.setting_value, setting.setting_type)
            }
        });

    } catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch setting'
        });
    }
});

// =====================================================
// UPDATE SETTING (Admin Only)
// =====================================================
router.put('/:key', async (req, res) => {
    try {
        // Check admin access
        const userRole = req.user?.role || req.headers['x-user-role'];
        const userBadge = req.user?.badge_number || req.headers['x-user-badge'] || 'unknown';

        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Value is required'
            });
        }

        // Get current setting to validate type
        const existing = await pool.query(`
            SELECT setting_key, setting_type, setting_value
            FROM system_settings
            WHERE setting_key = ?
        `, [key]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: `Setting '${key}' not found`
            });
        }

        const { setting_type, setting_value: oldValue } = existing[0];

        // Validate value type
        const stringValue = String(value);
        if (setting_type === 'boolean' && !['true', 'false'].includes(stringValue)) {
            return res.status(400).json({
                success: false,
                error: 'Boolean setting must be "true" or "false"'
            });
        }

        if (setting_type === 'number' && isNaN(Number(stringValue))) {
            return res.status(400).json({
                success: false,
                error: 'Number setting must be a valid number'
            });
        }

        // Update setting
        await pool.query(`
            UPDATE system_settings
            SET setting_value = ?, updated_by = ?
            WHERE setting_key = ?
        `, [stringValue, userBadge, key]);

        // Log audit event
        try {
            await pool.query(`
                INSERT INTO duty_audit_log (
                    supervisor_badge, supervisor_name, action_type,
                    action_details, previous_value, new_value
                ) VALUES (?, ?, 'SETTING_CHANGED', ?, ?, ?)
            `, [
                userBadge,
                req.user?.name || 'Admin',
                JSON.stringify({ setting_key: key }),
                oldValue,
                stringValue
            ]);
        } catch (auditError) {
            console.warn('Audit logging failed:', auditError.message);
        }

        // Log to Activity Feed with WebSocket broadcast
        await activityLogger.logActivity({
            activityType: ACTIVITY_TYPES.SETTINGS_CHANGED,
            action: `changed "${key}" from "${oldValue}" to "${stringValue}"`,
            actorType: ACTOR_TYPES.ADMIN,
            actorId: userBadge,
            actorName: req.user?.name || 'Admin',
            entityType: ENTITY_TYPES.SETTING,
            entityId: key,
            entityDetails: {
                setting_key: key,
                old_value: oldValue,
                new_value: stringValue,
                setting_type: setting_type
            },
            severity: SEVERITY_LEVELS.WARNING,
            source: 'admin_panel',
            icon: '⚙️'
        });

        res.json({
            success: true,
            message: `Setting '${key}' updated successfully`,
            setting: {
                key,
                value: stringValue,
                parsed_value: parseSettingValue(stringValue, setting_type),
                updated_by: userBadge
            }
        });

    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update setting'
        });
    }
});

// =====================================================
// BULK UPDATE SETTINGS (Admin Only)
// =====================================================
router.put('/', async (req, res) => {
    try {
        // Check admin access
        const userRole = req.user?.role || req.headers['x-user-role'];
        const userBadge = req.user?.badge_number || req.headers['x-user-badge'] || 'unknown';

        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        const { settings } = req.body;

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Settings object is required'
            });
        }

        const updates = [];
        const errors = [];

        for (const [key, value] of Object.entries(settings)) {
            try {
                // Check if setting exists
                const existing = await pool.query(`
                    SELECT setting_type FROM system_settings WHERE setting_key = ?
                `, [key]);

                if (existing.length === 0) {
                    errors.push({ key, error: 'Setting not found' });
                    continue;
                }

                const stringValue = String(value);
                await pool.query(`
                    UPDATE system_settings
                    SET setting_value = ?, updated_by = ?
                    WHERE setting_key = ?
                `, [stringValue, userBadge, key]);

                updates.push({ key, value: stringValue });
            } catch (err) {
                errors.push({ key, error: err.message });
            }
        }

        // Log to Activity Feed with WebSocket broadcast (if any updates succeeded)
        if (updates.length > 0) {
            await activityLogger.logActivity({
                activityType: ACTIVITY_TYPES.SETTINGS_CHANGED,
                action: `updated ${updates.length} setting(s)`,
                actorType: ACTOR_TYPES.ADMIN,
                actorId: userBadge,
                actorName: req.user?.name || 'Admin',
                entityType: ENTITY_TYPES.SETTING,
                entityDetails: {
                    updated_settings: updates.map(u => u.key),
                    count: updates.length,
                    errors: errors.length
                },
                severity: SEVERITY_LEVELS.WARNING,
                source: 'admin_panel',
                icon: '⚙️'
            });
        }

        res.json({
            success: true,
            updated: updates,
            errors: errors.length > 0 ? errors : undefined,
            message: `Updated ${updates.length} setting(s)`
        });

    } catch (error) {
        console.error('Error bulk updating settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update settings'
        });
    }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function parseSettingValue(value, type) {
    switch (type) {
        case 'boolean':
            return value === 'true';
        case 'number':
            return Number(value);
        case 'json':
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        default:
            return value;
    }
}

export default router;
