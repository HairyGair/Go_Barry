// Make diagnosticFlows globally available
window.diagnosticFlows = diagnosticFlows;

// Enhanced metadata for rapid decision system
const systemMetadata = {
    version: '2.1',
    type: 'rapid_decision_support',
    targetTime: '30-120 seconds per issue',
    optimizedFor: 'control_room_staff',
    lastUpdated: new Date().toISOString(),
    totalFlows: Object.keys(diagnosticFlows).length,
    criticalFlows: Object.values(diagnosticFlows).filter(f => f.category === 'safety_critical').length,
    highPriorityFlows: Object.values(diagnosticFlows).filter(f => f.category === 'high_priority').length,
    sdcCompliant: true,
    phase: 'Phase 4 - High Priority Flows Complete ✅',
    phaseProgress: {
        phase1: { status: 'complete', flows: 5, description: 'Critical Safety Flows (30-90 sec)' },
        phase4: { status: 'complete', flows: 5, description: 'High Priority Flows (60-120 sec)' },
        phase5: { status: 'pending', flows: 0, description: 'Standard Issues (awaiting)' }
    }
};

window.systemMetadata = systemMetadata;

console.log('🚀 Rapid Decision Diagnostic Flows - Phase 4 Complete:', systemMetadata);
console.log('Critical flows (Phase 1):', Object.keys(diagnosticFlows).filter(k => diagnosticFlows[k].category === 'safety_critical'));
console.log('High priority flows (Phase 4):', Object.keys(diagnosticFlows).filter(k => diagnosticFlows[k].category === 'high_priority'));
console.log('Total flows available:', Object.keys(diagnosticFlows).length);
