// backend/routes/adminBreakdowns.js

import express from 'express';
import axios from 'axios';

const router = express.Router();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// GET /api/admin-breakdowns - Get all breakdown logs
router.get('/', async (req, res) => {
    // Check if Supabase is configured
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({
            success: false,
            error: 'Supabase configuration missing. Please check environment variables.'
        });
    }
    
    try {
        // Optional query parameters
        const { 
            limit = 100, 
            offset = 0,
            supervisorId,
            vehicleReg,
            breakdownType,
            startDate,
            endDate
        } = req.query;
        
        // Build the query
        let queryParams = {
            order: 'timestamp.desc',
            limit: limit,
            offset: offset
        };
        
        // Build filter conditions
        let filters = [];
        
        if (supervisorId) {
            filters.push(`supervisor_id.eq.${supervisorId}`);
        }
        
        if (vehicleReg) {
            filters.push(`vehicle_reg.eq.${vehicleReg}`);
        }
        
        if (breakdownType) {
            filters.push(`breakdown_type.eq.${breakdownType}`);
        }
        
        if (startDate) {
            filters.push(`timestamp.gte.${startDate}`);
        }
        
        if (endDate) {
            filters.push(`timestamp.lte.${endDate}`);
        }
        
        // Apply filters directly as query parameters
        filters.forEach(filter => {
            const [field, operator, value] = filter.split('.');
            queryParams[field] = `${operator}.${value}`;
        });
        
        // Make request to Supabase
        const response = await axios({
            method: 'GET',
            url: `${SUPABASE_URL}/rest/v1/breakdowns`,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Range-Unit': 'items',
                'Range': `${offset}-${parseInt(offset) + parseInt(limit) - 1}`,
                'Prefer': 'count=exact'
            },
            params: queryParams
        });
        
        // Get total count from headers
        const contentRange = response.headers['content-range'];
        let totalCount = null;
        if (contentRange) {
            const match = contentRange.match(/\/(\d+)/);
            if (match) {
                totalCount = parseInt(match[1]);
            }
        }
        
        res.json({
            success: true,
            logs: response.data,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: totalCount
            }
        });
        
    } catch (error) {
        console.error('Error fetching breakdown logs:', error);
        
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                error: error.response.data.message || 'Failed to fetch breakdown logs'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Internal server error while fetching breakdown logs'
        });
    }
});

// GET /api/admin-breakdowns/stats - Get breakdown statistics
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Build date filter
        let dateFilter = '';
        if (startDate && endDate) {
            dateFilter = `?timestamp=gte.${startDate}&timestamp=lte.${endDate}`;
        }
        
        // Get all breakdowns for the period
        const response = await axios({
            method: 'GET',
            url: `${SUPABASE_URL}/rest/v1/breakdowns${dateFilter}`,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            }
        });
        
        const breakdowns = response.data;
        
        // Calculate statistics
        const stats = {
            totalBreakdowns: breakdowns.length,
            byType: {},
            bySupervisor: {},
            byVehicle: {},
            byDay: {}
        };
        
        // Process breakdown data
        breakdowns.forEach(breakdown => {
            // By type
            stats.byType[breakdown.breakdown_type] = (stats.byType[breakdown.breakdown_type] || 0) + 1;
            
            // By supervisor
            stats.bySupervisor[breakdown.supervisor_id] = (stats.bySupervisor[breakdown.supervisor_id] || 0) + 1;
            
            // By vehicle
            const vehicleKey = `${breakdown.vehicle_reg} (${breakdown.fleet_no})`;
            stats.byVehicle[vehicleKey] = (stats.byVehicle[vehicleKey] || 0) + 1;
            
            // By day
            const day = new Date(breakdown.timestamp).toLocaleDateString();
            stats.byDay[day] = (stats.byDay[day] || 0) + 1;
        });
        
        res.json({
            success: true,
            stats,
            period: {
                startDate: startDate || 'all time',
                endDate: endDate || 'present'
            }
        });
        
    } catch (error) {
        console.error('Error fetching breakdown statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch breakdown statistics'
        });
    }
});

export default router;
