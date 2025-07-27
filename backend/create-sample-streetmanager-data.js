#!/usr/bin/env node

/*
 * Create sample StreetManager data for fallback when webhooks aren't working
 * This ensures the app has roadworks data for testing and development
 * Run: node create-sample-streetmanager-data.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create realistic StreetManager fallback data
function createSampleStreetManagerData() {
  const currentDate = new Date();
  const futureDate1 = new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 1 week future
  const futureDate2 = new Date(currentDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // 2 weeks future
  const pastDate = new Date(currentDate.getTime() - (3 * 24 * 60 * 60 * 1000)); // 3 days ago

  return [
    {
      notification_id: 'SM-2025-001',
      title: 'A1(M) Emergency Carriageway Repair',
      location_description: 'A1(M) between Junction 65 and Junction 66, Northbound',
      activity_type: 'Emergency highway maintenance',
      actual_start_date_time: pastDate.toISOString(),
      proposed_end_date_time: futureDate1.toISOString(),
      permit_reference_number: 'NH-2025-A1-001',
      activity_location_coordinates: 'POINT(-1.6178 54.9783)',
      severity: 'High',
      webhook_received_at: currentDate.toISOString(),
      status: 'In Progress',
      authority: 'National Highways',
      traffic_management: 'Lane closure with convoy system',
      works_category: 'Emergency works',
      works_description: 'Emergency pothole repairs and surface patching on A1(M) northbound carriageway following winter weather damage',
      contact_details: 'National Highways North East: 0300 123 5000',
      diversion_route: 'Use A1 alternative route via local roads for HGVs',
      expected_impact: 'Delays of 15-30 minutes during peak hours'
    },
    {
      notification_id: 'SM-2025-002',
      title: 'B6318 Street Lighting Upgrade',
      location_description: 'B6318 Military Road, Hexham to Chollerford section',
      activity_type: 'Street lighting works',
      actual_start_date_time: futureDate1.toISOString(),
      proposed_end_date_time: futureDate2.toISOString(),
      permit_reference_number: 'NCC-2025-B6318-002',
      activity_location_coordinates: 'POINT(-2.1011 54.9721)',
      severity: 'Medium',
      webhook_received_at: currentDate.toISOString(),
      status: 'Planned',
      authority: 'Northumberland County Council',
      traffic_management: 'Temporary traffic signals',
      works_category: 'Highway improvement',
      works_description: 'Upgrading street lighting to LED along B6318 Military Road with improved visibility and energy efficiency',
      contact_details: 'Northumberland Highways: 01670 533000',
      diversion_route: 'Alternative route via A69 for through traffic',
      expected_impact: 'Minor delays during installation periods'
    },
    {
      notification_id: 'SM-2025-003',
      title: 'Quayside Bridge Annual Inspection',
      location_description: 'Tyne Bridge approach roads and Quayside',
      activity_type: 'Bridge structural inspection',
      actual_start_date_time: futureDate1.toISOString(),
      proposed_end_date_time: futureDate1.toISOString(), // Same day
      permit_reference_number: 'NCC-2025-TYNE-003',
      activity_location_coordinates: 'POINT(-1.6007 54.9692)',
      severity: 'Critical',
      webhook_received_at: currentDate.toISOString(),
      status: 'Planned',
      authority: 'Newcastle City Council',
      traffic_management: 'Full road closure between 06:00-16:00',
      works_category: 'Bridge maintenance',
      works_description: 'Annual structural safety inspection of Tyne Bridge with specialist access equipment',
      contact_details: 'Newcastle Highways: 0191 278 7878',
      diversion_route: 'Use High Level Bridge or Redheugh Bridge',
      expected_impact: 'Significant disruption to city centre access - use alternative river crossings'
    },
    {
      notification_id: 'SM-2025-004',
      title: 'Great North Road Gas Main Repair',
      location_description: 'Great North Road (A167), Gosforth',
      activity_type: 'Utility emergency works',
      actual_start_date_time: currentDate.toISOString(),
      proposed_end_date_time: futureDate1.toISOString(),
      permit_reference_number: 'NGN-2025-A167-004',
      activity_location_coordinates: 'POINT(-1.6119 55.0144)',
      severity: 'High',
      webhook_received_at: currentDate.toISOString(),
      status: 'Active',
      authority: 'Newcastle City Council',
      traffic_management: 'Lane closure with 4-way temporary lights',
      works_category: 'Emergency utility repair',
      works_description: 'Emergency gas main repair following reported leak. Safety critical works requiring immediate attention',
      contact_details: 'Northern Gas Networks Emergency: 0800 040 7766',
      diversion_route: 'Local traffic use side streets, through traffic via A1',
      expected_impact: 'Significant delays on main corridor - avoid area if possible'
    },
    {
      notification_id: 'SM-2025-005',
      title: 'A19 Surface Dressing',
      location_description: 'A19 between Cramlington and Blyth',
      activity_type: 'Road surface treatment',
      actual_start_date_time: futureDate2.toISOString(),
      proposed_end_date_time: new Date(futureDate2.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString(),
      permit_reference_number: 'NCC-2025-A19-005',
      activity_location_coordinates: 'POINT(-1.5164 55.1336)',
      severity: 'Medium',
      webhook_received_at: currentDate.toISOString(),
      status: 'Planned',
      authority: 'Northumberland County Council',
      traffic_management: 'Rolling road closure with convoy system',
      works_category: 'Planned maintenance',
      works_description: 'Preventative surface dressing to extend road life and improve skid resistance',
      contact_details: 'Northumberland Highways: 01670 533000',
      diversion_route: 'Signed diversions via A1 and local roads',
      expected_impact: 'Some delays during treatment periods - work follows traffic'
    }
  ];
}

async function createFallbackDataFile() {
  console.log('🔧 Creating sample StreetManager fallback data...\n');

  const sampleData = createSampleStreetManagerData();
  
  console.log('📊 Generated sample StreetManager records:');
  sampleData.forEach((record, index) => {
    console.log(`${index + 1}. ${record.title}`);
    console.log(`   📍 ${record.location_description}`);
    console.log(`   📅 ${record.actual_start_date_time.split('T')[0]} to ${record.proposed_end_date_time.split('T')[0]}`);
    console.log(`   🚨 Severity: ${record.severity} | Status: ${record.status}`);
    console.log('');
  });

  // Create the fallback data structure
  const fallbackData = {
    data: sampleData,
    timestamp: Date.now(),
    lastUpdate: new Date().toISOString(),
    count: sampleData.length,
    source: 'sample_generation',
    note: 'Sample data for development and testing when StreetManager webhooks are not available'
  };

  // Write to fallback file
  const fallbackPath = path.join(__dirname, 'data/streetmanager_fallback.json');
  
  try {
    await fs.writeFile(fallbackPath, JSON.stringify(fallbackData, null, 2));
    console.log(`✅ Successfully created fallback data file: ${fallbackPath}`);
    console.log(`📊 Contains ${sampleData.length} sample StreetManager records`);
    console.log(`🔧 This will be used when webhook data is unavailable`);
  } catch (error) {
    console.error('❌ Failed to create fallback data file:', error.message);
  }
}

// Run the data creation
createFallbackDataFile().catch(console.error);