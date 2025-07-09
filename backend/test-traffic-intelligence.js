#!/usr/bin/env node
// test-traffic-intelligence.js
// Debug traffic intelligence system

import { trafficIntelligence } from './services/unifiedTrafficIntelligence.js';
import { enhancedDataSourceManager } from './services/enhancedDataSourceManager.js';

async function testTrafficIntelligence() {
  console.log('🔍 Testing Traffic Intelligence System');
  console.log('=====================================');
  
  // Test 1: Check enhanced data source manager
  console.log('\n1️⃣ Testing Enhanced Data Source Manager...');
  try {
    const aggregated = await enhancedDataSourceManager.aggregateAllSources();
    console.log('✅ Data source manager working');
    console.log(`📊 Total alerts: ${aggregated.alerts?.length || 0}`);
    console.log(`📊 Incidents: ${aggregated.incidents?.length || 0}`);
    console.log(`📊 Roadworks: ${aggregated.roadworks?.length || 0}`);
    
    if (aggregated.alerts && aggregated.alerts.length > 0) {
      const sample = aggregated.alerts[0];
      console.log('\n📋 Sample alert:');
      console.log(`   ID: ${sample.id}`);
      console.log(`   Type: ${sample.type}`);
      console.log(`   Location: ${sample.location}`);
      console.log(`   Severity: ${sample.severity}`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Affects Routes: ${sample.affectsRoutes?.join(', ') || 'None'}`);
    }
  } catch (error) {
    console.error('❌ Data source manager failed:', error.message);
  }
  
  // Test 2: Check unified traffic intelligence
  console.log('\n2️⃣ Testing Unified Traffic Intelligence...');
  try {
    const intelligence = await trafficIntelligence.getTrafficIntelligence();
    console.log('Result:', {
      success: intelligence.success,
      dataLength: intelligence.data?.length,
      error: intelligence.error
    });
    
    if (intelligence.success) {
      console.log('✅ Traffic intelligence working');
      console.log(`📊 Total alerts: ${intelligence.data.length}`);
      console.log('📊 Sources:', intelligence.metadata.sources);
      
      if (intelligence.data.length > 0) {
        const sample = intelligence.data[0];
        console.log('\n📋 Sample intelligent alert:');
        console.log(`   ID: ${sample.id}`);
        console.log(`   Type: ${sample.type}`);
        console.log(`   Location: ${sample.location}`);
        console.log(`   Intelligence Score: ${sample.intelligenceScore}`);
        console.log(`   Route Impact: ${sample.routeImpact?.level || 'Not assessed'}`);
        console.log(`   Affects Routes: ${sample.affectsRoutes?.join(', ') || 'None'}`);
        console.log(`   Has Coordinates: ${!!sample.coordinates}`);
        
        if (sample.coordinates) {
          console.log(`   Coordinates: ${sample.coordinates.lat || sample.coordinates[0]}, ${sample.coordinates.lng || sample.coordinates[1]}`);
        }
      }
    } else {
      console.log('❌ Traffic intelligence failed:', intelligence.error);
    }
  } catch (error) {
    console.error('❌ Traffic intelligence error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  // Test 3: Check alerts endpoint
  console.log('\n3️⃣ Testing Alerts Enhanced Endpoint...');
  try {
    const response = await fetch('http://localhost:3001/api/alerts-enhanced');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Alerts enhanced endpoint working');
      console.log(`📊 Total alerts: ${data.alerts?.length || 0}`);
      console.log('📊 Sources:', Object.keys(data.metadata?.sources || {}));
    } else {
      console.log('❌ Alerts enhanced endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Alerts enhanced endpoint error:', error.message);
  }
}

testTrafficIntelligence().catch(console.error);