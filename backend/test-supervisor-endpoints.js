// Test script for supervisor management endpoints
import fetch from 'node-fetch';

const API_BASE = 'https://go-barry.onrender.com';
const TEST_ADMIN_ID = 'supervisor003'; // Andrew Gibson - Admin
const TEST_ADMIN_BADGE = 'AG003';

async function testEndpoints() {
  console.log('🧪 Testing Supervisor Management Endpoints\n');

  try {
    // Step 1: Admin Login
    console.log('1️⃣ Testing Admin Login...');
    const loginResponse = await fetch(`${API_BASE}/api/supervisor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supervisorId: TEST_ADMIN_ID,
        badge: TEST_ADMIN_BADGE
      })
    });
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.error}`);
    }
    
    const sessionId = loginData.sessionId;
    console.log(`✅ Login successful. Session ID: ${sessionId}\n`);

    // Step 2: Test Add Supervisor
    console.log('2️⃣ Testing Add Supervisor...');
    const addResponse = await fetch(`${API_BASE}/api/supervisor/admin/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        name: 'Test Supervisor',
        role: 'Supervisor',
        badge: 'TEST001',
        shift: 'Day',
        permissions: ['view-alerts', 'dismiss-alerts'],
        email: 'test@gobarry.co.uk',
        phone: '0123456789'
      })
    });
    const addData = await addResponse.json();
    console.log(`${addData.success ? '✅' : '❌'} Add Supervisor: ${addData.success ? 'Success' : addData.error}\n`);

    // Step 3: Test Edit Supervisor
    console.log('3️⃣ Testing Edit Supervisor...');
    const editResponse = await fetch(`${API_BASE}/api/supervisor/admin/edit/supervisor001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        name: 'Alex Woodcock (Updated)',
        shift: 'Night'
      })
    });
    const editData = await editResponse.json();
    console.log(`${editData.success ? '✅' : '❌'} Edit Supervisor: ${editData.success ? 'Success' : editData.error}\n`);

    // Step 4: Test Reset Password
    console.log('4️⃣ Testing Reset Password...');
    const resetResponse = await fetch(`${API_BASE}/api/supervisor/admin/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        supervisorId: 'supervisor001',
        newPassword: 'Barry456'
      })
    });
    const resetData = await resetResponse.json();
    console.log(`${resetData.success ? '✅' : '❌'} Reset Password: ${resetData.success ? 'Success' : resetData.error}\n`);

    // Step 5: Test Get Activity
    console.log('5️⃣ Testing Get Supervisor Activity...');
    const activityResponse = await fetch(`${API_BASE}/api/supervisor/supervisors/supervisor001/activity?limit=10`);
    const activityData = await activityResponse.json();
    console.log(`${activityData.success ? '✅' : '❌'} Get Activity: ${activityData.success ? `Found ${activityData.activity?.length || 0} activities` : activityData.error}\n`);

    // Step 6: Test Delete Supervisor (using body params)
    console.log('6️⃣ Testing Delete Supervisor...');
    const deleteResponse = await fetch(`${API_BASE}/api/supervisor/admin/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        supervisorId: 'supervisor010' // Delete a test supervisor if exists
      })
    });
    const deleteData = await deleteResponse.json();
    console.log(`${deleteData.success ? '✅' : '❌'} Delete Supervisor: ${deleteData.success ? 'Success' : deleteData.error}\n`);

    // Step 7: Test Get All Supervisors
    console.log('7️⃣ Testing Get All Supervisors...');
    const listResponse = await fetch(`${API_BASE}/api/supervisor/supervisors`);
    const listData = await listResponse.json();
    console.log(`${listData.success ? '✅' : '❌'} Get All Supervisors: ${listData.success ? `Found ${listData.supervisors?.length || 0} supervisors` : listData.error}\n`);

    console.log('✅ All endpoint tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testEndpoints().catch(console.error);