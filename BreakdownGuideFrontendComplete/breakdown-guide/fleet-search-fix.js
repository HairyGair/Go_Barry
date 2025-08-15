// Fleet Search Fix for Breakdown Guide
// This script ensures the fleet database is properly integrated with the FleetSelectionModal

(function() {
    console.log('🚗 Fleet Search Fix initializing...');
    
    // Wait for React components to be ready
    let retryCount = 0;
    const maxRetries = 10;
    
    function checkAndFixFleetSearch() {
        retryCount++;
        
        // Check if FleetSelectionModal exists
        if (window.FleetSelectionModal) {
            console.log('✅ FleetSelectionModal found');
            
            // Patch the modal to ensure it uses the correct search method
            const originalModal = window.FleetSelectionModal;
            
            // Create a wrapper that ensures fleet database is loaded
            window.FleetSelectionModal = function(props) {
                // Make sure fleet database is available
                if (!window.fleetDatabase || !window.fleetDatabase.fleetData) {
                    console.log('⚠️ Fleet database not ready, loading...');
                    
                    // Try to load it
                    fetch('/backend/data/fleet-database.json')
                        .then(res => res.json())
                        .then(data => {
                            if (!window.fleetDatabase) {
                                window.fleetDatabase = {
                                    fleetData: data,
                                    searchVehicles: function(query) {
                                        const searchTerm = query.toString().toLowerCase();
                                        return Object.values(this.fleetData).filter(vehicle => 
                                            vehicle.fleetNumber.toString().includes(searchTerm) ||
                                            vehicle.registration.toLowerCase().includes(searchTerm)
                                        );
                                    }
                                };
                            } else {
                                window.fleetDatabase.fleetData = data;
                            }
                            console.log('✅ Fleet database loaded via fix:', Object.keys(data).length, 'vehicles');
                        })
                        .catch(err => {
                            console.error('❌ Failed to load fleet database:', err);
                        });
                }
                
                // Call the original component
                return originalModal.call(this, props);
            };
            
            // Copy over any static properties
            Object.keys(originalModal).forEach(key => {
                window.FleetSelectionModal[key] = originalModal[key];
            });
            
            console.log('✅ FleetSelectionModal patched successfully');
            
        } else if (retryCount < maxRetries) {
            console.log(`⏳ Waiting for FleetSelectionModal... (attempt ${retryCount}/${maxRetries})`);
            setTimeout(checkAndFixFleetSearch, 1000);
        } else {
            console.error('❌ FleetSelectionModal not found after maximum retries');
        }
    }
    
    // Start checking after a short delay
    setTimeout(checkAndFixFleetSearch, 500);
    
    // Also provide a manual fix function
    window.fixFleetSearch = function() {
        console.log('🔧 Manual fleet search fix triggered');
        
        // Force reload the fleet database
        fetch('/backend/data/fleet-database.json')
            .then(res => res.json())
            .then(data => {
                if (!window.fleetDatabase) {
                    window.fleetDatabase = {};
                }
                window.fleetDatabase.fleetData = data;
                window.fleetDatabase.searchVehicles = function(query) {
                    const searchTerm = query.toString().toLowerCase();
                    return Object.values(this.fleetData).filter(vehicle => 
                        vehicle.fleetNumber.toString().includes(searchTerm) ||
                        vehicle.registration.toLowerCase().includes(searchTerm)
                    );
                };
                
                console.log('✅ Fleet database manually fixed:', Object.keys(data).length, 'vehicles');
                alert('Fleet search has been fixed! Try searching again.');
            })
            .catch(err => {
                console.error('❌ Failed to fix fleet database:', err);
                alert('Failed to fix fleet search. Check console for errors.');
            });
    };
    
    // Log instructions
    console.log('💡 If fleet search is not working, type: window.fixFleetSearch()');
})();
