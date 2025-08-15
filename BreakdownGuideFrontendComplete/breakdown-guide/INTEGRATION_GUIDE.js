// Example: How to integrate Breakdown Analytics into GO BARRY Wizards
// This shows the modifications needed for each wizard

// STEP 1: Add to the HTML file (breakdown-guide/index.html or guide.html)
// Add this script tag after the other component scripts:
// <script src="components/common/breakdownAnalytics.js"></script>

// STEP 2: Modify the App.js handleComplete function
// Replace the existing handleComplete with this enhanced version:

const handleCompleteWithAnalytics = async () => {
    // Get the final decision based on responses
    let finalDecision = 'CONTINUE'; // default
    
    // Determine severity based on wizard type and responses
    if (currentWizard === 'brakes') {
        // Any "yes" response in brakes wizard = STOP
        if (responses.pedalSinks === 'yes' || 
            responses.delayedResponse === 'yes' ||
            responses.unusualNoises === 'yes' ||
            responses.visibleLeaks === 'yes' ||
            responses.brakesGrabbing === 'yes' ||
            responses.warningLight === 'yes') {
            finalDecision = 'STOP';
        }
    } else if (currentWizard === 'steering') {
        // Similar logic for steering
        if (responses.excessivePlay === 'yes' ||
            responses.difficultyTurning === 'yes' ||
            responses.steeringNoises === 'yes' ||
            responses.vehiclePulling === 'yes') {
            finalDecision = 'STOP';
        }
    } else if (currentWizard === 'cooling_system') {
        const temp = parseInt(responses.temperature);
        if (temp > 100 || responses.leaksPresent === 'yes') {
            finalDecision = 'STOP';
        } else if (temp > 90 || responses.waterBuzzer === 'yes') {
            finalDecision = 'AMBER';
        }
    }
    // Add more wizard-specific logic as needed
    
    // Record the breakdown event
    if (window.BreakdownAnalytics) {
        try {
            const result = await window.BreakdownAnalytics.recordBreakdown(
                currentWizard,
                responses,
                finalDecision
            );
            
            if (result.success) {
                console.log('✅ Breakdown recorded successfully');
                
                // Check for patterns
                const patterns = await window.BreakdownAnalytics.checkPatterns(
                    responses.fleetNumber,
                    responses.depot || window.BreakdownAnalytics.detectDepot(responses.fleetNumber)
                );
                
                if (patterns.length > 0) {
                    // Show pattern alerts to the user
                    const criticalPatterns = patterns.filter(p => p.severity === 'critical');
                    if (criticalPatterns.length > 0) {
                        alert(`⚠️ CRITICAL PATTERN DETECTED:\n${criticalPatterns[0].pattern_description}`);
                    }
                }
            } else if (result.offline) {
                console.log('📱 Breakdown saved offline for later sync');
            }
        } catch (error) {
            console.error('Failed to record breakdown:', error);
        }
    }
    
    // Original completion logic
    alert('Assessment completed! Data has been recorded.');
    setCurrentWizard(null);
    setCurrentStep(1);
    setResponses({});
};

// STEP 3: Update specific wizard steps to collect required data
// For example, in Step 1 of each wizard, ensure we collect:
// - fleetNumber (vehicle number)
// - supervisorName (who's conducting the assessment)
// - location (where the issue occurred)
// - routeNumber (if applicable)

// Example for BrakesWizard Step 1 modification:
const BrakesWizardStep1Enhanced = () => {
    return (
        <div className="space-y-6">
            {/* Existing content... */}
            
            {/* Add these fields if not already present: */}
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Vehicle Information</h3>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Fleet Number *
                    </label>
                    <input
                        type="text"
                        value={responses.fleetNumber || ''}
                        onChange={(e) => updateResponse('fleetNumber', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500"
                        placeholder="e.g., 6301"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Route Number
                    </label>
                    <input
                        type="text"
                        value={responses.routeNumber || ''}
                        onChange={(e) => updateResponse('routeNumber', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500"
                        placeholder="e.g., 21"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Location
                    </label>
                    <input
                        type="text"
                        value={responses.location || ''}
                        onChange={(e) => updateResponse('location', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500"
                        placeholder="e.g., Newcastle City Centre"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Your Name
                    </label>
                    <input
                        type="text"
                        value={responses.supervisorName || ''}
                        onChange={(e) => updateResponse('supervisorName', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500"
                        placeholder="Supervisor name"
                    />
                </div>
            </div>
            
            {/* Rest of existing brake symptom checks... */}
        </div>
    );
};

// STEP 4: Backend Integration
// Update your backend index.js to include the new route:
/*
import breakdownAnalyticsAPI from './routes/breakdownAnalyticsAPI.js';

// Add after other route definitions:
app.use('/api/breakdown-analytics', breakdownAnalyticsAPI);
*/

// STEP 5: Database Setup Instructions
/*
1. Run the schema creation:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and run the breakdown_analytics_schema.sql content
   
2. Test the setup:
   cd backend
   node scripts/setup-breakdown-analytics.js
   
3. Add sample data (optional):
   node scripts/setup-breakdown-analytics.js --sample-data
*/

// STEP 6: Environment Variables
// Ensure your .env file has the Supabase credentials:
/*
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
*/