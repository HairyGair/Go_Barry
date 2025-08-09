// backend/routes/breakdownLogger.js

import express from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Check if Supabase is configured
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('⚠️  Supabase configuration missing in breakdownLogger.js');
    console.error('   Required: SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)');
}

// Helper function to make Supabase requests
const supabaseRequest = async (method, endpoint, data = null) => {
    const config = {
        method,
        url: `${SUPABASE_URL}/rest/v1/${endpoint}`,
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    };
    
    if (data) {
        config.data = data;
    }
    
    return axios(config);
};

// POST /api/breakdowns/log - Log a new breakdown
router.post('/log', async (req, res) => {
    // Check if Supabase is configured
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({
            success: false,
            error: 'Supabase configuration missing. Please check environment variables.'
        });
    }
    
    try {
        const { supervisorId, vehicleReg, fleetNo, breakdownType, timestamp } = req.body;
        
        // Validate required fields
        if (!supervisorId || !vehicleReg || !fleetNo || !breakdownType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields. Please provide supervisorId, vehicleReg, fleetNo, and breakdownType.'
            });
        }
        
        // Prepare data for insertion
        const breakdownData = {
            id: uuidv4(),
            supervisor_id: supervisorId,
            vehicle_reg: vehicleReg,
            fleet_no: fleetNo,
            breakdown_type: breakdownType,
            timestamp: timestamp || new Date().toISOString()
        };
        
        // Insert into Supabase
        const response = await supabaseRequest('POST', 'breakdowns', breakdownData);
        
        // Return success response
        res.json({
            success: true,
            data: response.data[0] // Return the inserted record
        });
        
    } catch (error) {
        console.error('Error logging breakdown:', error);
        
        // Handle Supabase errors
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                error: error.response.data.message || 'Failed to log breakdown'
            });
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            error: 'Internal server error while logging breakdown'
        });
    }
});

// GET /api/breakdowns/recent - Get recent breakdowns (optional endpoint)
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const response = await axios({
            method: 'GET',
            url: `${SUPABASE_URL}/rest/v1/breakdowns`,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            params: {
                order: 'timestamp.desc',
                limit: limit
            }
        });
        
        res.json({
            success: true,
            breakdowns: response.data
        });
        
    } catch (error) {
        console.error('Error fetching recent breakdowns:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent breakdowns'
        });
    }
});

export default router;
