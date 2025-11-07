import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Cooling System (Overheating) Wizard Component
// Follows operational safety procedures Section: "Overheating" (Page 11)
// Ensures full compliance with DVSA standards and Tranzaura system integration

const CoolingSystemWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    console.log('CoolingSystemWizard - currentStep:', currentStep, 'responses:', responses);
    // Get icons from imported Icons
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Tool, Gauge } = Icons;
    
    // Determine final decision based on operational safety procedures and complete assessment
    const handleCompleteAssessment = () => {
        let finalDecision = 'CONTINUE';
        let notes = 'Overheating assessment completed per standard operational procedures v1.3. ';
        
        // Decision logic based on operational safety procedures
        if (responses.temperature_reading === '80_100_continue') {
            finalDecision = 'CONTINUE';
            notes += 'Temperature within normal range (80-100°C). Vehicle may continue to convenient changeover point.';
        } else if (responses.leak_inspection === 'leaks_present') {
            finalDecision = 'STOP';
            notes += 'Water leaks detected. Vehicle stopped immediately - engineering assistance required.';
        } else if (responses.heat_mitigation_result === 'problem_persists') {
            finalDecision = 'STOP';
            notes += 'Heat mitigation unsuccessful. Vehicle stopped - engineering assistance required.';
        } else if (responses.heat_mitigation_result === 'issue_resolved') {
            finalDecision = 'AMBER';
            notes += 'Heat mitigation successful. Vehicle may continue to next convenient changeover point.';
        } else if (responses.water_buzzer_status === 'no_buzzer') {
            finalDecision = 'AMBER';
            notes += 'No water buzzer sounding. Vehicle may continue to next changeover point.';
        } else if (responses.water_topup_feasible === 'can_reach_topup') {
            finalDecision = 'AMBER';
            notes += 'Low water identified. Vehicle can safely reach water top-up location.';
        } else if (responses.water_topup_feasible === 'cannot_reach_safely') {
            finalDecision = 'STOP';
            notes += 'Low water identified. Cannot safely reach top-up location - engineering assistance required.';
        } else if (responses.temperature_reading === 'gauge_faulty') {
            finalDecision = 'AMBER';
            notes += 'Temperature gauge faulty. Proceed with caution to changeover point.';
        } else {
            // Safety fallback for any edge cases
            finalDecision = 'AMBER';
            notes += 'Assessment completed. Vehicle may continue to next changeover point with caution.';
        }
        
        // Log for debugging
        console.log('CoolingSystemWizard - handleCompleteAssessment:', { finalDecision, notes, responses });
        
        onComplete(finalDecision, notes);
    };
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <Gauge className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🌡️ Overheating Assessment</h2>
                        <p className="text-gray-300">Following standard operational safety checks Guide v1.3 Step 1: Check the Temperature Gauge - ensuring engine protection and safe operation.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">🔥 Critical Engine Protection System</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed">
                            Overheating can cause catastrophic engine damage. operational safety procedures provides specific temperature thresholds and actions to prevent engine failure and ensure DVSA compliance.
                        </p>
                    </div>

                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h3 className="text-lg font-semibold text-purple-200 mb-4">📋 DVSA Compliance</h3>
                        <p className="text-purple-300/80 text-sm leading-relaxed">
                            Cooling system defects are categorized under DVSA "Categorisation of Vehicle Defects" guidelines. Overheating issues may constitute dangerous defects requiring immediate attention to prevent engine damage and ensure road safety.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Step 1: Check the Temperature Gauge</h3>
                        <p className="text-gray-300 text-sm mb-4">What is the current engine temperature reading?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { 
                                    updateResponse('temperature_reading', '80_100_continue'); 
                                    // This should complete immediately, not go to next
                                    // onNext(); 
                                }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.temperature_reading === '80_100_continue'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.temperature_reading === '80_100_continue' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.temperature_reading === '80_100_continue' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ 80–100°C (Normal Range)</span>
                                        <p className="text-sm text-gray-300 mt-1">Action: Advise the driver they can continue to a convenient changeover point</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('temperature_reading', 'over_100_assess'); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.temperature_reading === 'over_100_assess'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.temperature_reading === 'over_100_assess' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.temperature_reading === 'over_100_assess' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🌡️ Over 100°C</span>
                                        <p className="text-sm text-gray-300 mt-1">Action: Proceed to Step 2</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('temperature_reading', 'gauge_faulty'); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.temperature_reading === 'gauge_faulty'
                                        ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.temperature_reading === 'gauge_faulty' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                                    }`}>
                                        {responses.temperature_reading === 'gauge_faulty' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❓ Temperature gauge not working</span>
                                        <p className="text-sm text-gray-300 mt-1">Unable to get accurate temperature reading</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {responses.temperature_reading === '80_100_continue' && (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-green-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ NORMAL TEMPERATURE RANGE</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">Operational Guidance: Temperature within acceptable range (80-100°C)</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">Action:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Continue to convenient changeover point</li>
                                                <li>Monitor temperature throughout journey</li>
                                                <li>Record any concerns in Tranzaura system</li>
                                                <li>No immediate engine risk at current temperature</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {responses.temperature_reading === 'over_100_assess' && (
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                            <div className="flex items-start">
                                <AlertTriangle className="w-8 h-8 text-orange-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-orange-200 mb-3">🌡️ ELEVATED TEMPERATURE</h3>
                                    <div className="text-orange-300/90 space-y-2">
                                        <p className="font-semibold">Operational Guidance: Over 100°C requires cause identification</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-orange-200 mb-2">Next Step Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                                                <li>Proceed to Step 2: Identify the Cause</li>
                                                <li>Determine if issue is Low Water or Overheating</li>
                                                <li>Follow systematic assessment process</li>
                                                <li>Engine damage risk increases with temperature</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={
                                (responses.temperature_reading === '80_100_continue' || responses.temperature_reading === 'gauge_faulty')
                                    ? handleCompleteAssessment 
                                    : onNext
                            }
                            disabled={!responses.temperature_reading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {(responses.temperature_reading === '80_100_continue' || responses.temperature_reading === 'gauge_faulty')
                                ? 'Complete Assessment' 
                                : 'Next Step'
                            }
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-orange-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔍 Step 2: Identify the Cause</h2>
                        <p className="text-gray-300">Following standard operational safety checks Guide v1.3: Determine whether the issue is Low Water or Overheating to guide appropriate response.</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Cause Identification</h3>
                        <p className="text-gray-300 text-sm mb-4">What appears to be the primary cause of the elevated temperature?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('cause_identification', 'low_water'); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.cause_identification === 'low_water'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.cause_identification === 'low_water' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.cause_identification === 'low_water' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">💧 Low Water</span>
                                        <p className="text-sm text-gray-300 mt-1">Coolant level appears insufficient</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('cause_identification', 'overheating'); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.cause_identification === 'overheating'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.cause_identification === 'overheating' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.cause_identification === 'overheating' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔥 Overheating</span>
                                        <p className="text-sm text-gray-300 mt-1">System overheating despite adequate coolant</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {responses.cause_identification === 'low_water' && (
                        <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                            <h3 className="text-lg font-semibold text-white mb-4">Low Water Assessment</h3>
                            <p className="text-gray-300 text-sm mb-4">Operational Guidance: Can the driver safely reach the next location to top up the water?</p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => { updateResponse('water_topup_feasible', 'can_reach_topup'); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.water_topup_feasible === 'can_reach_topup'
                                            ? 'border-green-400 bg-green-400/20 text-green-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.water_topup_feasible === 'can_reach_topup' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                        }`}>
                                            {responses.water_topup_feasible === 'can_reach_topup' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <span className="font-medium">✅ Can safely reach water top-up location</span>
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => { updateResponse('water_topup_feasible', 'cannot_reach_safely'); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.water_topup_feasible === 'cannot_reach_safely'
                                            ? 'border-red-400 bg-red-400/20 text-red-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.water_topup_feasible === 'cannot_reach_safely' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                        }`}>
                                            {responses.water_topup_feasible === 'cannot_reach_safely' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <span className="font-medium">❌ Cannot safely reach top-up location</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={
                                (responses.water_topup_feasible === 'can_reach_topup' || responses.water_topup_feasible === 'cannot_reach_safely')
                                    ? handleCompleteAssessment
                                    : onNext
                            }
                            disabled={!responses.cause_identification || (responses.cause_identification === 'low_water' && !responses.water_topup_feasible)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {(responses.water_topup_feasible === 'can_reach_topup' || responses.water_topup_feasible === 'cannot_reach_safely')
                                ? 'Complete Assessment'
                                : 'Next Step'
                            }
                        </button>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-yellow-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔊 Step 3: Determine if the Water Buzzer is Sounding</h2>
                        <p className="text-gray-300">Following standard operational safety checks Guide v1.3: Check if the water buzzer is sounding to guide next actions.</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Water Buzzer Status</h3>
                        <p className="text-gray-300 text-sm mb-4">Is the water buzzer currently sounding?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('water_buzzer_status', 'no_buzzer'); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.water_buzzer_status === 'no_buzzer'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.water_buzzer_status === 'no_buzzer' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.water_buzzer_status === 'no_buzzer' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔇 No Buzzer</span>
                                        <p className="text-sm text-gray-300 mt-1">Action: Advise the driver to continue to the next changeover point</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('water_buzzer_status', 'buzzer_sounding'); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.water_buzzer_status === 'buzzer_sounding'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.water_buzzer_status === 'buzzer_sounding' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.water_buzzer_status === 'buzzer_sounding' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔊 Buzzer Sounding</span>
                                        <p className="text-sm text-gray-300 mt-1">Action: Proceed to Step 4</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {responses.water_buzzer_status === 'no_buzzer' && (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-green-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ NO WATER BUZZER</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">Operational Guidance: Continue to next changeover point</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">Action:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Proceed to next convenient changeover point</li>
                                                <li>Continue monitoring temperature</li>
                                                <li>Record defect in Tranzaura system</li>
                                                <li>Arrange engineering inspection at depot</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={responses.water_buzzer_status === 'no_buzzer' ? handleCompleteAssessment : onNext}
                            disabled={!responses.water_buzzer_status}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {responses.water_buzzer_status === 'no_buzzer' ? 'Complete Assessment' : 'Next Step'}
                        </button>
                    </div>
                </div>
            );

        case 4:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                            <Tool className="w-8 h-8 text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔍 Step 4: Inspect for Water Leaks</h2>
                        <p className="text-gray-300">Following standard operational safety checks Guide v1.3: Safe visual inspection for water leaks - NEVER ask a driver to step into the highway.</p>
                    </div>

                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ CRITICAL SAFETY PROTOCOL</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed">
                            operational safety procedures: "NEVER ask a driver to step into the highway, ensure they stay safe at all times." Only inspect areas safely accessible from the kerb.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Water Leak Inspection (Safe Areas Only)</h3>
                        <p className="text-gray-300 text-sm mb-4">Are there visible signs of water leaks from safe viewing positions?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('leak_inspection', 'leaks_present'); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.leak_inspection === 'leaks_present'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.leak_inspection === 'leaks_present' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.leak_inspection === 'leaks_present' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">💦 Leaks Present</span>
                                        <p className="text-sm text-gray-300 mt-1">Action: Advise the driver to stop immediately and await engineering assistance</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('leak_inspection', 'no_leaks'); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.leak_inspection === 'no_leaks'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.leak_inspection === 'no_leaks' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.leak_inspection === 'no_leaks' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No Leaks</span>
                                        <p className="text-sm text-gray-300 mt-1">Action: Proceed to Step 5</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {responses.leak_inspection === 'leaks_present' && (
                        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                            <div className="flex items-start">
                                <XCircle className="w-8 h-8 text-red-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🛑 COOLANT LEAK DETECTED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">operational safety procedures: Advise the driver to stop immediately and await engineering assistance</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Immediate Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Stop the vehicle immediately in a safe location</li>
                                                <li>Await qualified engineering assistance</li>
                                                <li>Do not attempt to continue - risk of engine damage</li>
                                                <li>Document leak location and severity for engineers</li>
                                                <li>Monitor temperature if engine still running</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-200">Tranzaura System Reminder</h4>
                                <p className="text-sm text-blue-300/90 mt-1">
                                    Log this incident in Tranzaura system when stationary and in a safe location
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={responses.leak_inspection === 'leaks_present' ? handleCompleteAssessment : onNext}
                            disabled={!responses.leak_inspection}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {responses.leak_inspection === 'leaks_present' ? 'Complete Assessment' : 'Next Step'}
                        </button>
                    </div>
                </div>
            );

        case 5:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <Tool className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔥 Step 5: Mitigate the Issue Using Heaters and Demisters</h2>
                        <p className="text-gray-300">Following standard operational safety checks Guide v1.3: Instruct the driver to turn on the heaters and demisters to disperse heat in the system.</p>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">🌡️ Heat Distribution Strategy</h3>
                        <p className="text-blue-300/80 text-sm leading-relaxed">
                            operational safety procedures: "Instruct the driver to turn on the heaters and demisters to disperse heat in the system." This helps reduce engine temperature by using the cabin heating system as an additional radiator.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Heat Mitigation Results</h3>
                        <p className="text-gray-300 text-sm mb-4">After turning on heaters and demisters to disperse heat, has this resolved the overheating issue?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('heat_mitigation_result', 'issue_resolved'); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.heat_mitigation_result === 'issue_resolved'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.heat_mitigation_result === 'issue_resolved' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.heat_mitigation_result === 'issue_resolved' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ If this resolves the issue</span>
                                        <p className="text-sm text-gray-300 mt-1">Action: Advise the driver to continue to the next convenient changeover point</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('heat_mitigation_result', 'problem_persists'); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.heat_mitigation_result === 'problem_persists'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.heat_mitigation_result === 'problem_persists' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.heat_mitigation_result === 'problem_persists' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ If the problem persists</span>
                                        <p className="text-sm text-gray-300 mt-1">Action: Instruct the driver to stop and await engineering assistance</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {responses.heat_mitigation_result === 'issue_resolved' && (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-green-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ HEAT MITIGATION SUCCESSFUL</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">operational safety procedures: Advise the driver to continue to the next convenient changeover point</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Continue to next convenient changeover point</li>
                                                <li>Keep heaters/demisters running to maintain heat dispersion</li>
                                                <li>Monitor temperature gauge continuously</li>
                                                <li>Record defect in Tranzaura system</li>
                                                <li>Arrange engineering inspection at depot</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {responses.heat_mitigation_result === 'problem_persists' && (
                        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                            <div className="flex items-start">
                                <XCircle className="w-8 h-8 text-red-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🛑 HEAT MITIGATION FAILED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">operational safety procedures: Instruct the driver to stop and await engineering assistance</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Immediate Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Stop the vehicle in a safe location</li>
                                                <li>Await qualified engineering assistance</li>
                                                <li>Do not attempt to continue - risk of engine damage</li>
                                                <li>Keep heaters/demisters running if engine still running</li>
                                                <li>Monitor temperature and be prepared to shut off engine</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-200">Tranzaura System Documentation</h4>
                                <p className="text-sm text-blue-300/90 mt-1">
                                    Record: Overheating - {responses.cause_identification} - Heat mitigation: {responses.heat_mitigation_result}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleCompleteAssessment}
                            disabled={!responses.heat_mitigation_result}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Complete Assessment
                        </button>
                    </div>
                </div>
            );

        default:
            console.error('CoolingSystemWizard - Invalid step:', currentStep);
            return (
                <div className="text-center space-y-4">
                    <div className="text-red-500">Error: Invalid step {currentStep}</div>
                    <button 
                        onClick={() => handleCompleteAssessment()}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500"
                    >
                        Complete Assessment
                    </button>
                </div>
            );
    }
};

// Export to global scope for use in the main application
window.CoolingSystemWizard = CoolingSystemWizard;

export default CoolingSystemWizard;
