// frequencyAPI.js
// API endpoints for service frequency data

import express from 'express';
import serviceFrequencyAnalyzer from '../services/serviceFrequencyAnalyzer.js';

const router = express.Router();

// Initialize analyzer on startup
(async () => {
    try {
        await serviceFrequencyAnalyzer.initialize();
        console.log('✅ Service Frequency API ready');
    } catch (error) {
        console.error('❌ Failed to initialize Service Frequency API:', error);
    }
})();

// Get frequency for single route
router.get('/route/:routeId', async (req, res) => {
    try {
        const { routeId } = req.params;
        const frequency = serviceFrequencyAnalyzer.getRouteFrequency(routeId);
        
        if (!frequency) {
            return res.status(404).json({
                success: false,
                message: `No frequency data for route ${routeId}`
            });
        }
        
        res.json({
            success: true,
            routeId,
            frequency,
            summary: serviceFrequencyAnalyzer.getFrequencySummary(routeId)
        });
    } catch (error) {
        console.error('Error getting route frequency:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get frequencies for multiple routes
router.post('/routes', async (req, res) => {
    try {
        const { routeIds } = req.body;
        
        if (!Array.isArray(routeIds)) {
            return res.status(400).json({
                success: false,
                message: 'routeIds must be an array'
            });
        }
        
        const frequencies = serviceFrequencyAnalyzer.getMultipleRouteFrequencies(routeIds);
        const impact = serviceFrequencyAnalyzer.getImpactScore(routeIds);
        
        // Create summaries for each route
        const summaries = {};
        for (const routeId of routeIds) {
            summaries[routeId] = serviceFrequencyAnalyzer.getFrequencySummary(routeId);
        }
        
        res.json({
            success: true,
            frequencies,
            summaries,
            impact
        });
    } catch (error) {
        console.error('Error getting route frequencies:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get high-frequency routes
router.get('/high-frequency', async (req, res) => {
    try {
        const allFrequencies = serviceFrequencyAnalyzer.routeFrequencies;
        const highFrequency = [];
        
        for (const [routeId, freq] of allFrequencies) {
            if (freq.overall && freq.overall.category === 'high-frequency') {
                highFrequency.push({
                    routeId,
                    frequency: freq,
                    summary: serviceFrequencyAnalyzer.getFrequencySummary(routeId)
                });
            }
        }
        
        res.json({
            success: true,
            count: highFrequency.length,
            routes: highFrequency
        });
    } catch (error) {
        console.error('Error getting high-frequency routes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Force refresh frequency data
router.post('/refresh', async (req, res) => {
    try {
        serviceFrequencyAnalyzer.isInitialized = false;
        await serviceFrequencyAnalyzer.initialize();
        
        res.json({
            success: true,
            message: 'Service frequency data refreshed',
            routesAnalyzed: serviceFrequencyAnalyzer.routeFrequencies.size
        });
    } catch (error) {
        console.error('Error refreshing frequency data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;