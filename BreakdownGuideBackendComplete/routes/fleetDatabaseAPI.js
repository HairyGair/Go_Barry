// backend/routes/fleetDatabaseAPI.js
// API endpoint to serve fleet database

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to fleet database
const FLEET_DB_PATH = path.join(__dirname, '../data/fleet-database.json');

// GET /api/fleet-database - Get full fleet database
router.get('/', (req, res) => {
    try {
        if (!fs.existsSync(FLEET_DB_PATH)) {
            return res.status(404).json({
                success: false,
                error: 'Fleet database not found'
            });
        }
        
        const fleetData = JSON.parse(fs.readFileSync(FLEET_DB_PATH, 'utf8'));
        
        res.json({
            success: true,
            count: Object.keys(fleetData).length,
            data: fleetData
        });
    } catch (error) {
        console.error('Error reading fleet database:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/fleet-database/:fleetNumber - Get specific vehicle
router.get('/:fleetNumber', (req, res) => {
    try {
        const { fleetNumber } = req.params;
        
        if (!fs.existsSync(FLEET_DB_PATH)) {
            return res.status(404).json({
                success: false,
                error: 'Fleet database not found'
            });
        }
        
        const fleetData = JSON.parse(fs.readFileSync(FLEET_DB_PATH, 'utf8'));
        const vehicle = fleetData[fleetNumber];
        
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: `Vehicle with fleet number ${fleetNumber} not found`
            });
        }
        
        res.json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        console.error('Error reading fleet database:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/fleet-database/search/:query - Search vehicles
router.get('/search/:query', (req, res) => {
    try {
        const { query } = req.params;
        const searchTerm = query.toLowerCase();
        
        if (!fs.existsSync(FLEET_DB_PATH)) {
            return res.status(404).json({
                success: false,
                error: 'Fleet database not found'
            });
        }
        
        const fleetData = JSON.parse(fs.readFileSync(FLEET_DB_PATH, 'utf8'));
        
        const results = Object.values(fleetData).filter(vehicle => 
            vehicle.fleetNumber.includes(searchTerm) ||
            vehicle.registration.toLowerCase().includes(searchTerm) ||
            vehicle.busType.toLowerCase().includes(searchTerm) ||
            vehicle.depot.toLowerCase().includes(searchTerm)
        );
        
        res.json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('Error searching fleet database:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/fleet-database/depot/:depot - Get vehicles by depot
router.get('/depot/:depot', (req, res) => {
    try {
        const { depot } = req.params;
        
        if (!fs.existsSync(FLEET_DB_PATH)) {
            return res.status(404).json({
                success: false,
                error: 'Fleet database not found'
            });
        }
        
        const fleetData = JSON.parse(fs.readFileSync(FLEET_DB_PATH, 'utf8'));
        
        const vehicles = Object.values(fleetData).filter(vehicle => 
            vehicle.depot.toLowerCase() === depot.toLowerCase()
        );
        
        res.json({
            success: true,
            depot: depot,
            count: vehicles.length,
            data: vehicles
        });
    } catch (error) {
        console.error('Error reading fleet database:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/fleet-database/update - Update fleet database (admin only)
router.post('/update', (req, res) => {
    try {
        const { fleetData } = req.body;
        
        if (!fleetData || typeof fleetData !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid fleet data provided'
            });
        }
        
        // Create backup
        if (fs.existsSync(FLEET_DB_PATH)) {
            const backupPath = FLEET_DB_PATH.replace('.json', `-backup-${Date.now()}.json`);
            fs.copyFileSync(FLEET_DB_PATH, backupPath);
            console.log(`✅ Backup created: ${backupPath}`);
        }
        
        // Write new data
        fs.writeFileSync(FLEET_DB_PATH, JSON.stringify(fleetData, null, 2));
        
        res.json({
            success: true,
            message: 'Fleet database updated successfully',
            count: Object.keys(fleetData).length
        });
    } catch (error) {
        console.error('Error updating fleet database:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
