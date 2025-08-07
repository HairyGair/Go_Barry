// Direct test of escalation service bypassing API routing
import escalationService from '../services/escalationService.js';

async function testDirectEscalation() {
  console.log('🧪 Testing Escalation Service Directly');
  console.log('=====================================');
  
  const testAlert = {
    id: `direct-test-${Date.now()}`,
    title: 'Direct Escalation Test',
    location: 'A1 Newcastle Test Area',
    street_name: 'A1 Great North Road',
    description: 'Testing escalation service directly',
    coordinates: [54.9783, -1.6178],
    sm_works_description: 'Lane closure for utility work',
    sm_traffic_management_type: 'Lane closure',
    sm_start_date: '2025-08-08',
    sm_end_date: '2025-08-15',
    severity: 'medium',
    source: 'direct-test'
  };

  const escalationOptions = {
    pushToDatabase: true,
    pushToDisplay: false,
    emailManager: false,
    reason: 'Direct testing of escalation service',
    urgencyLevel: 'medium',
    workflowNotes: 'Testing direct service call',
    servicesAffected: ['21', '22'],
    ticketMachineMessage: 'TEST: Service delays expected',
    customerMessage: 'TEST: We are experiencing delays'
  };

  try {
    console.log('🚀 Calling escalationService.handleEscalation directly...');
    
    const result = await escalationService.handleEscalation(
      testAlert, 
      escalationOptions, 
      'AG003'
    );

    console.log('✅ Direct escalation test successful!');
    console.log('📋 Results:', JSON.stringify(result, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Direct escalation test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

testDirectEscalation()
  .then(success => {
    console.log(success ? '🎉 Direct test passed' : '💥 Direct test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(console.error);