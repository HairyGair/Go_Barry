#!/usr/bin/env node

/**
 * Test Supabase Migration - Verify services work with new database
 */

import supervisorManager from './services/supervisorManager.js';
import eventMonitor from './services/eventMonitor.js';
import messageTemplateManager from './services/messageTemplateManager.js';

console.log('🧪 Testing Supabase Migration...\n');

async function testSupervisorManager() {
  console.log('👥 Testing SupervisorManager...');
  
  try {
    // Test getting all supervisors
    const supervisors = await supervisorManager.getAllSupervisors();
    console.log(`✅ Found ${supervisors.length} supervisors`);
    
    // Test supervisor authentication
    if (supervisors.length > 0) {
      const firstSupervisor = supervisors[0];
      console.log(`🔐 Testing auth for ${firstSupervisor.name} (${firstSupervisor.badge})`);
      
      const authResult = await supervisorManager.authenticateSupervisor(
        firstSupervisor.id, 
        firstSupervisor.badge
      );
      
      if (authResult.success) {
        console.log(`✅ Authentication successful for ${firstSupervisor.name}`);
        
        // Test session validation
        const sessionValidation = await supervisorManager.validateSupervisorSession(authResult.sessionId);
        if (sessionValidation.success) {
          console.log(`✅ Session validation successful`);
        } else {
          console.log(`❌ Session validation failed: ${sessionValidation.error}`);
        }
        
        // Clean up session
        await supervisorManager.signOutSupervisor(authResult.sessionId);
      } else {
        console.log(`❌ Authentication failed: ${authResult.error}`);
      }
    }
  } catch (error) {
    console.error('❌ SupervisorManager test failed:', error.message);
  }
  
  console.log('');
}

async function testEventMonitor() {
  console.log('📅 Testing EventMonitor...');
  
  try {
    // Test getting active events
    const activeEvents = await eventMonitor.getActiveEvents();
    console.log(`✅ Active events: ${activeEvents.count}`);
    
    // Test getting all events
    const allEvents = await eventMonitor.getAllEvents();
    console.log(`✅ Total events in database: ${allEvents.length}`);
    
    // Test getting upcoming events
    const upcomingEvents = await eventMonitor.getUpcomingEvents();
    console.log(`✅ Upcoming events: ${upcomingEvents.length}`);
    
    // Test event statistics
    const stats = await eventMonitor.getEventStatistics();
    console.log(`✅ Event statistics: ${stats.total} total, ${stats.active} active`);
    
  } catch (error) {
    console.error('❌ EventMonitor test failed:', error.message);
  }
  
  console.log('');
}

async function testMessageTemplateManager() {
  console.log('📝 Testing MessageTemplateManager...');
  
  try {
    // Test getting templates
    const templatesResult = await messageTemplateManager.getTemplates();
    if (templatesResult.success) {
      console.log(`✅ Found ${templatesResult.templates.length} templates`);
      console.log(`✅ Found ${templatesResult.categories.length} categories`);
    } else {
      console.log(`❌ Failed to get templates: ${templatesResult.error}`);
    }
    
    // Test getting template stats
    const statsResult = await messageTemplateManager.getTemplateStats();
    if (statsResult.success) {
      console.log(`✅ Template statistics loaded`);
      console.log(`   - Total templates: ${statsResult.statistics.totalTemplates}`);
      console.log(`   - Most used: ${statsResult.statistics.mostUsedTemplates.length}`);
    } else {
      console.log(`❌ Failed to get template stats: ${statsResult.error}`);
    }
    
    // Test template suggestion
    const suggestions = await messageTemplateManager.suggestTemplates({
      title: 'Traffic delay on A1',
      description: 'Minor delays due to roadworks',
      location: 'A1 Newcastle'
    });
    
    if (suggestions.success) {
      console.log(`✅ Template suggestions: ${suggestions.suggestions.length} found`);
    } else {
      console.log(`❌ Template suggestions failed`);
    }
    
  } catch (error) {
    console.error('❌ MessageTemplateManager test failed:', error.message);
  }
  
  console.log('');
}

async function runAllTests() {
  console.log('🚀 Starting migration verification tests...\n');
  
  await testSupervisorManager();
  await testEventMonitor();
  await testMessageTemplateManager();
  
  console.log('✅ Migration tests completed!');
  console.log('\n📋 Summary:');
  console.log('- SupervisorManager: Uses Supabase for supervisor data and dismissals');
  console.log('- EventMonitor: Uses Supabase major_events table');
  console.log('- MessageTemplateManager: Uses Supabase message_templates and template_categories');
  console.log('\n🎉 Supabase migration verification complete!');
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
