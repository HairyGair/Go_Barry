// Enhanced Fleet Selection Integration
// Automatically replaces the standard FleetSelectionModal with the enhanced version

(function() {
    console.log('🔧 Enhanced Fleet Selection Integration loading...');
    
    // Wait for both components to be loaded
    function waitForComponents() {
        return new Promise((resolve) => {
            const checkComponents = () => {
                if (window.EnhancedFleetSelectionModal && window.FleetSelectionModal) {
                    resolve();
                } else {
                    setTimeout(checkComponents, 100);
                }
            };
            checkComponents();
        });
    }
    
    // Replace the standard modal with enhanced version
    waitForComponents().then(() => {
        console.log('✅ Enhanced Fleet Selection Integration active');
        
        // Store the original for fallback
        window.OriginalFleetSelectionModal = window.FleetSelectionModal;
        
        // Replace with enhanced version
        window.FleetSelectionModal = window.EnhancedFleetSelectionModal;
        
        // Add global CSS for enhanced styling
        const enhancedStyles = document.createElement('style');
        enhancedStyles.textContent = `
            /* Enhanced Fleet Selection Styles */
            .fleet-number-highlight {
                background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
                animation: pulse 2s infinite;
            }
            
            .depot-badge {
                position: relative;
                overflow: hidden;
            }
            
            .depot-badge::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s ease;
            }
            
            .depot-badge:hover::before {
                left: 100%;
            }
            
            .vehicle-info-enhanced {
                transform: translateY(0);
                transition: all 0.3s ease;
            }
            
            .vehicle-info-enhanced:hover {
                transform: translateY(-2px);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
            
            /* Fleet input styling */
            .enhanced-fleet-input {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border: 2px solid transparent;
                transition: all 0.3s ease;
            }
            
            .enhanced-fleet-input:focus {
                border-color: #3b82f6;
                background: white;
                transform: scale(1.02);
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            }
        `;
        document.head.appendChild(enhancedStyles);
        
        console.log('🎨 Enhanced Fleet Selection styles applied');
        
        // Add helper functions to global scope
        window.fleetSelectionHelpers = {
            // Function to pre-populate fleet number if coming from external system
            preSelectFleet: function(fleetNumber) {
                if (window.currentFleetModal) {
                    window.currentFleetModal.setFleetNumber(fleetNumber);
                }
            },
            
            // Function to get enhanced vehicle info
            getEnhancedVehicleInfo: async function(fleetNumber) {
                if (window.fleetDatabase) {
                    const vehicle = window.fleetDatabase.getByFleetNumber(fleetNumber);
                    if (vehicle) {
                        // Add enhanced info (driver, route, etc.)
                        return {
                            ...vehicle,
                            driver: await mockGetDriverInfo(fleetNumber),
                            route: await mockGetRouteInfo(fleetNumber),
                            dutyNumber: await mockGetDutyInfo(fleetNumber)
                        };
                    }
                }
                return null;
            }
        };
        
        // Mock functions for driver information (replace with real API calls)
        async function mockGetDriverInfo(fleetNumber) {
            // This would integrate with your duty roster system
            const mockDrivers = {
                '6301': 'John Smith',
                '5423': 'Sarah Johnson', 
                '638': 'Mike Wilson',
                '6162': 'Emma Davies',
                '5285': 'James Brown'
            };
            return mockDrivers[fleetNumber] || 'Driver TBC';
        }
        
        async function mockGetRouteInfo(fleetNumber) {
            // This would integrate with your service planning system
            const mockRoutes = {
                '6301': '56',
                '5423': '42',
                '638': 'V9',
                '6162': '685',
                '5285': '39'
            };
            return mockRoutes[fleetNumber] || 'Route TBC';
        }
        
        async function mockGetDutyInfo(fleetNumber) {
            // This would integrate with your duty roster system
            const mockDuties = {
                '6301': 'D123',
                '5423': 'D087',
                '638': 'D045',
                '6162': 'D156',
                '5285': 'D098'
            };
            return mockDuties[fleetNumber] || 'Duty TBC';
        }
        
        console.log('🚌 Enhanced Fleet Selection ready - supervisors can now see driver, depot, and vehicle type when entering fleet numbers');
    });
    
    // Add event listener for when fleet modal is shown
    document.addEventListener('fleetModalOpened', function(event) {
        console.log('🔍 Fleet selection modal opened for wizard:', event.detail.wizardType);
        
        // Log analytics
        if (window.BreakdownAnalytics) {
            window.BreakdownAnalytics.trackEvent('fleet_selection_opened', {
                wizardType: event.detail.wizardType,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Add event listener for successful vehicle selection
    document.addEventListener('vehicleSelected', function(event) {
        const vehicle = event.detail.vehicle;
        console.log('✅ Vehicle selected:', {
            fleet: vehicle.fleetNumber,
            driver: vehicle.driver,
            depot: vehicle.depot,
            type: vehicle.vehicleType
        });
        
        // Log analytics
        if (window.BreakdownAnalytics) {
            window.BreakdownAnalytics.trackEvent('vehicle_selected', {
                fleetNumber: vehicle.fleetNumber,
                depot: vehicle.depot,
                vehicleType: vehicle.vehicleType,
                driver: vehicle.driver,
                timestamp: new Date().toISOString()
            });
        }
    });
    
})();