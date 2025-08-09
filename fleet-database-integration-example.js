// Example integration for BreakdownInfoStep.js
// Add this to your existing BreakdownInfoStep component

// Inside the component, add this handler for fleet number changes:
const handleFleetNumberChange = (e) => {
    const fleetNo = e.target.value;
    updateBreakdownInfo({ fleetNo });
    
    // Auto-populate from fleet database
    if (window.fleetDatabase && fleetNo.length >= 4) {
        const vehicle = window.fleetDatabase.getByFleetNumber(fleetNo);
        if (vehicle) {
            updateBreakdownInfo({ 
                fleetNo: vehicle.fleetNumber,
                vehicleReg: vehicle.registration 
            });
            
            // Show vehicle info
            console.log(`✅ Found: ${vehicle.busType} at ${vehicle.depot}`);
            
            // Optional: Show a success message
            if (window.showNotification) {
                window.showNotification(
                    `Vehicle found: ${vehicle.registration} (${vehicle.busType})`,
                    'success'
                );
            }
        }
    }
};

// Update the fleet number input field:
<input
    type="text"
    placeholder="e.g., 5301"
    value={breakdownInfo.fleetNo}
    onChange={handleFleetNumberChange}
    className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
    required
/>

// Add a vehicle info display (optional):
{breakdownInfo.fleetNo && window.fleetDatabase?.getByFleetNumber(breakdownInfo.fleetNo) && (
    <div className="mt-2 text-sm text-blue-300">
        {window.fleetDatabase.formatVehicleInfo(breakdownInfo.fleetNo)}
    </div>
)}
