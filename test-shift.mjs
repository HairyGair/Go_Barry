// Test script to verify shift persistence
import fetch from 'node-fetch';

const API_BASE = 'https://go-barry.onrender.com';
const TEST_BADGE = 'AG003';
const TEST_DUTY = '100';

async function testShiftManagement() {
  console.log('🧪 Testing Shift Management API...\n');
  
  // 1. Check current shift
  console.log('1️⃣ Checking current shift for', TEST_BADGE);
  const currentResponse = await fetch(`${API_BASE}/api/shifts/current-shift/${TEST_BADGE}`);
  const currentData = await currentResponse.json();
  console.log('Current shift:', currentData);
  
  // 2. Clock in if not already
  if (!currentData.shift) {
    console.log('\n2️⃣ Clocking in with duty', TEST_DUTY);
    const clockInResponse = await fetch(`${API_BASE}/api/shifts/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supervisorBadge: TEST_BADGE,
        dutyCode: TEST_DUTY
      })
    });
    const clockInData = await clockInResponse.json();
    console.log('Clock in result:', clockInData);
    
    // 3. Verify shift is active
    console.log('\n3️⃣ Verifying shift is now active');
    const verifyResponse = await fetch(`${API_BASE}/api/shifts/current-shift/${TEST_BADGE}`);
    const verifyData = await verifyResponse.json();
    console.log('Verified shift:', verifyData);
  } else {
    console.log('✅ Already clocked in with duty:', currentData.shift.duty_code);
  }
  
  console.log('\n✨ Test complete!');
}

testShiftManagement().catch(console.error);
