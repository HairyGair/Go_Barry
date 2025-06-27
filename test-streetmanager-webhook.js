// Test StreetManager webhook with the exact data structure from the error
// Save this as test-webhook.js and run with: node test-webhook.js

const webhookData = {
  "event_reference": 128587307,
  "event_type": "PERMIT_ALTERATION_GRANTED",
  "object_data": {
    "work_reference_number": "LC10620213165",
    "permit_reference_number": "LC10620213165-01",
    "promoter_swa_code": "4420",
    "promoter_organisation": "SHEFFIELD CITY COUNCIL",
    "highway_authority": "SHEFFIELD CITY COUNCIL",
    "works_location_coordinates": "POINT(433674.488 380502.109)",
    "street_name": "LOWEDGES ROAD",
    "area_name": "",
    "work_category": "Major",
    "traffic_management_type": "Stop/go boards",
    "proposed_start_date": "2025-06-15T23:00:00.000Z",
    "proposed_start_time": "2025-06-15T23:00:00.000Z",
    "proposed_end_date": "2025-07-04T22:59:00.000Z",
    "proposed_end_time": "2025-07-04T22:59:00.000Z",
    "actual_start_date_time": "2025-06-16T06:47:17.000Z",
    "actual_end_date_time": null,
    "work_status": "Works in progress",
    "usrn": "34409447",
    "highway_authority_swa_code": "4420",
    "work_category_ref": "major",
    "traffic_management_type_ref": "stop_go_boards",
    "work_status_ref": "in_progress",
    "activity_type": "Utility asset works",
    "is_ttro_required": "No",
    "is_covid_19_response": null,
    "works_location_type": "Carriageway",
    "permit_conditions": "NCT01a, NCT02a, NCT05a, NCT06a, NCT08a, NCT11b, NCT01b, NCT11a",
    "road_category": "8",
    "is_traffic_sensitive": "Yes",
    "is_deemed": "No",
    "permit_status": "granted",
    "town": "SHEFFIELD",
    "collaborative_working": "No",
    "close_footway": "No",
    "close_footway_ref": "no",
    "current_traffic_management_type": null,
    "current_traffic_management_type_ref": null,
    "current_traffic_management_update_date": null
  },
  "event_time": "2025-06-27T17:26:01.809Z",
  "object_type": "PERMIT",
  "object_reference": "LC10620213165-01",
  "version": 1
};

// Create SNS message wrapper
const snsMessage = {
  Type: "Notification",
  MessageId: `test-${Date.now()}`,
  TopicArn: "arn:aws:sns:eu-west-2:000000000000:streetmanager-topic",
  Subject: "StreetManager Notification",
  Message: JSON.stringify(webhookData),
  Timestamp: new Date().toISOString(),
  SignatureVersion: "1",
  Signature: "test-signature"
};

console.log('🚀 Testing StreetManager webhook with real data...\n');

// Test the webhook
fetch('https://go-barry.onrender.com/api/streetmanager/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-amz-sns-message-type': 'Notification',
    'x-amz-sns-message-id': snsMessage.MessageId,
    'x-amz-sns-topic-arn': snsMessage.TopicArn
  },
  body: JSON.stringify(snsMessage)
})
.then(res => res.json())
.then(result => {
  console.log('✅ Webhook response:', result);
  
  // Now check if it was saved
  console.log('\n🔍 Checking if notification was saved...\n');
  
  return fetch('https://go-barry.onrender.com/api/streetmanager/notifications?limit=5');
})
.then(res => res.json())
.then(result => {
  if (result.success) {
    console.log(`📊 Found ${result.notifications?.length || 0} notifications in database`);
    
    // Look for our test
    const ourTest = result.notifications?.find(n => 
      n.permit_reference_number === 'LC10620213165-01' ||
      n.raw_webhook_data?.object_reference === 'LC10620213165-01'
    );
    
    if (ourTest) {
      console.log('✅ Test notification was saved successfully!');
      console.log('📍 Location:', ourTest.street_name || ourTest.location_description);
      console.log('🗺️ Coordinates:', ourTest.coordinates);
    } else {
      console.log('❌ Test notification not found in database');
      console.log('This means the webhook received it but failed to save to Supabase');
    }
  } else {
    console.log('❌ Failed to fetch notifications:', result.error);
  }
})
.catch(err => {
  console.error('❌ Test failed:', err.message);
});
