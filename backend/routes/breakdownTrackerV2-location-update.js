// =====================================================
// BREAKDOWN TRACKER V2 - LOCATION UPDATE
// Add this to your existing breakdownTrackerV2.js
// =====================================================

// Add to the existing /start endpoint
router.post('/start', async (req, res) => {
    try {
        const { 
            fleet_number, 
            supervisor_badge, 
            supervisor_name,
            depot_id,
            wizard_type,
            
            // NEW LOCATION FIELDS
            location,
            location_type,
            location_coords,
            location_w3w,
            location_verified,
            route_number
        } = req.body;
        
        // Validate required fields
        if (!fleet_number || !supervisor_badge || !location) {
            return res.status(400).json({ 
                success: false, 
                error: 'Fleet number, supervisor badge, and location are required' 
            });
        }
        
        // Generate IDs (existing code)
        const breakdownId = await generateBreakdownId();
        const dailyId = await generateDailyId();
        
        // Check for repeat breakdowns (existing code)
        const repeatCheck = await checkRepeatBreakdowns(fleet_number);
        
        // Insert breakdown with location data
        const { data: breakdown, error } = await supabase
            .from('breakdowns')
            .insert({
                breakdown_id: breakdownId,
                daily_id: dailyId,
                fleet_no: fleet_number,
                supervisor_badge,
                supervisor_name,
                depot_id,
                wizard_type,
                
                // Location data
                location,
                location_type,
                location_coords,
                location_w3w,
                location_verified: location_verified || false,
                route_number,
                
                // Status tracking
                status: 'in_progress',
                started_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) {
            console.error('Error creating breakdown:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to create breakdown record' 
            });
        }
        
        // Log location capture event
        await supabase
            .from('breakdown_events')
            .insert({
                breakdown_id: breakdownId,
                event_type: 'location_captured',
                event_data: {
                    type: location_type,
                    verified: location_verified,
                    has_coords: !!location_coords,
                    has_w3w: !!location_w3w
                },
                created_at: new Date().toISOString()
            });
        
        res.json({
            success: true,
            breakdown_id: breakdownId,
            daily_id: dailyId,
            data: {
                ...breakdown,
                repeat_warning: repeatCheck.isRepeat ? repeatCheck.message : null
            }
        });
    } catch (error) {
        console.error('Error in /start:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// NEW ENDPOINT: Update location if vehicle moves
router.put('/location/:breakdownId', async (req, res) => {
    try {
        const { breakdownId } = req.params;
        const { 
            location,
            location_type,
            location_coords,
            location_w3w,
            location_verified,
            updated_by
        } = req.body;
        
        // Update breakdown location
        const { data, error } = await supabase
            .from('breakdowns')
            .update({
                location,
                location_type,
                location_coords,
                location_w3w,
                location_verified,
                location_updated_at: new Date().toISOString()
            })
            .eq('breakdown_id', breakdownId)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating location:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to update location' 
            });
        }
        
        // Log location update event
        await supabase
            .from('breakdown_events')
            .insert({
                breakdown_id: breakdownId,
                event_type: 'location_updated',
                event_data: {
                    previous_location: data.location,
                    new_location: location,
                    updated_by
                },
                created_at: new Date().toISOString()
            });
        
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// ENHANCED /live endpoint with location data
router.get('/live', async (req, res) => {
    try {
        const { data: breakdowns, error } = await supabase
            .from('breakdowns')
            .select(`
                *,
                location,
                location_type,
                location_coords,
                location_w3w,
                location_verified,
                route_number
            `)
            .in('status', ['in_progress', 'diagnosed', 'escalated'])
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching live breakdowns:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch breakdowns' 
            });
        }
        
        // Enhance with calculated fields
        const enhanced = breakdowns.map(breakdown => ({
            ...breakdown,
            
            // Time calculations
            minutes_since_start: getMinutesSince(breakdown.started_at),
            minutes_since_diagnosis: breakdown.diagnosed_at ? 
                getMinutesSince(breakdown.diagnosed_at) : null,
            
            // Location display
            location_display: formatLocationDisplay(breakdown),
            has_precise_location: !!(breakdown.location_coords || breakdown.location_w3w),
            
            // Maps URL
            maps_url: breakdown.location_coords ? 
                `https://www.google.com/maps?q=${breakdown.location_coords.lat},${breakdown.location_coords.lng}` : null,
            w3w_url: breakdown.location_w3w ? 
                `https://w3w.co/${breakdown.location_w3w}` : null
        }));
        
        res.json({
            success: true,
            breakdowns: enhanced,
            total: enhanced.length
        });
    } catch (error) {
        console.error('Error in /live:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// NEW ENDPOINT: Get breakdown hotspots
router.get('/hotspots', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        // Get breakdowns with coordinates from last N days
        const { data: breakdowns, error } = await supabase
            .from('breakdowns')
            .select('location_coords, location_w3w, location')
            .not('location_coords', 'is', null)
            .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
        
        if (error) {
            console.error('Error fetching hotspots:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch hotspot data' 
            });
        }
        
        // Group by location (using grid squares for clustering)
        const hotspots = {};
        
        breakdowns.forEach(breakdown => {
            if (breakdown.location_coords) {
                // Create grid key (rounds to ~100m squares)
                const gridKey = `${Math.round(breakdown.location_coords.lat * 1000) / 1000},${Math.round(breakdown.location_coords.lng * 1000) / 1000}`;
                
                if (!hotspots[gridKey]) {
                    hotspots[gridKey] = {
                        center: breakdown.location_coords,
                        count: 0,
                        locations: []
                    };
                }
                
                hotspots[gridKey].count++;
                hotspots[gridKey].locations.push(breakdown.location);
            }
        });
        
        // Convert to array and sort by frequency
        const hotspotArray = Object.entries(hotspots)
            .map(([key, data]) => ({
                ...data,
                gridKey: key
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // Top 20 hotspots
        
        res.json({
            success: true,
            hotspots: hotspotArray,
            period_days: days,
            total_breakdowns: breakdowns.length
        });
    } catch (error) {
        console.error('Error in /hotspots:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Helper function to format location display
function formatLocationDisplay(breakdown) {
    if (breakdown.location_verified && breakdown.location_type === 'depot') {
        return `📍 ${breakdown.location} ✓`;
    } else if (breakdown.location_verified && breakdown.location_type === 'bus_station') {
        return `🚏 ${breakdown.location} ✓`;
    } else if (breakdown.location_w3w) {
        return `📍 ${breakdown.location} (///${breakdown.location_w3w})`;
    } else {
        return `📍 ${breakdown.location}`;
    }
}

// Helper function to calculate minutes
function getMinutesSince(timestamp) {
    if (!timestamp) return null;
    const diff = Date.now() - new Date(timestamp).getTime();
    return Math.floor(diff / 60000);
}

module.exports = router;