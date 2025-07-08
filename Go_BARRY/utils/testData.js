/**
 * Test data for Disruption Database testing
 * Provides sample disruptions for testing export and communication features
 */

export const generateTestDisruptions = () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return [
    {
      id: 'test-incident-001',
      type: 'incident',
      title: 'RTC - Tyne Bridge Emergency Closure',
      location: 'Tyne Bridge, Newcastle',
      description: 'Multi-vehicle collision blocking both carriageways. Emergency services on scene. Expected clearance 2-3 hours.',
      status: 'active',
      priority: 'critical',
      affectedRoutes: ['Q1', 'Q2', '12', '39', '40'],
      createdAt: yesterday.toISOString(),
      createdBy: 'AG003',
      lastUpdated: now.toISOString(),
      source: 'manual'
    },
    {
      id: 'test-roadwork-001',
      type: 'roadwork',
      title: 'Gas Works - City Centre Repairs',
      location: 'Grey Street, Newcastle City Centre',
      description: 'Northern Gas Networks emergency repair work. Lane restrictions in place.',
      status: 'monitoring',
      priority: 'high',
      affectedRoutes: ['Q3', '21', '22', 'X21'],
      createdAt: yesterday.toISOString(),
      createdBy: 'BP009',
      lastUpdated: now.toISOString(),
      authority: 'Newcastle City Council',
      startDate: yesterday.toISOString(),
      endDate: tomorrow.toISOString(),
      source: 'roadwork'
    },
    {
      id: 'test-streetmanager-001',
      type: 'streetmanager',
      title: 'Street Manager - Utility Works on A167',
      location: 'A167 Durham Road, Gateshead',
      description: 'Northumbrian Water emergency repair. Traffic lights controlling flow.',
      status: 'active',
      priority: 'medium',
      affectedRoutes: ['21', '28', '29'],
      createdAt: now.toISOString(),
      createdBy: 'System',
      lastUpdated: now.toISOString(),
      authority: 'Gateshead Council',
      permitReference: 'NGN-2024-001234',
      timelineStatus: 'IN PROGRESS TODAY',
      isEmergency: true,
      durationEstimate: '4-6 hours',
      proposedStartDate: yesterday.toISOString(),
      source: 'streetmanager'
    },
    {
      id: 'test-incident-002',
      type: 'incident',
      title: 'Breakdown - A1 Southbound',
      location: 'A1 Southbound, Junction 65',
      description: 'Large vehicle breakdown in lane 1. Recovery en route.',
      status: 'completed',
      priority: 'low',
      affectedRoutes: ['X12'],
      createdAt: yesterday.toISOString(),
      createdBy: 'AG003',
      lastUpdated: now.toISOString(),
      source: 'manual'
    },
    {
      id: 'test-roadwork-002',
      type: 'roadwork',
      title: 'Planned Works - Byker Bridge Maintenance',
      location: 'Byker Bridge, Newcastle',
      description: 'Scheduled bridge maintenance works. Weekend closure planned.',
      status: 'approved',
      priority: 'planned',
      affectedRoutes: ['12', '39', '40'],
      createdAt: now.toISOString(),
      createdBy: 'BP009',
      lastUpdated: now.toISOString(),
      authority: 'Newcastle City Council',
      startDate: tomorrow.toISOString(),
      endDate: new Date(tomorrow.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      source: 'roadwork'
    }
  ];
};

export const getTestSummary = () => {
  const testData = generateTestDisruptions();
  
  return {
    total: testData.length,
    byType: {
      incident: testData.filter(d => d.type === 'incident').length,
      roadwork: testData.filter(d => d.type === 'roadwork').length,
      streetmanager: testData.filter(d => d.type === 'streetmanager').length
    },
    byStatus: {
      active: testData.filter(d => d.status === 'active').length,
      monitoring: testData.filter(d => d.status === 'monitoring').length,
      completed: testData.filter(d => d.status === 'completed').length,
      approved: testData.filter(d => d.status === 'approved').length
    },
    byPriority: {
      critical: testData.filter(d => d.priority === 'critical').length,
      high: testData.filter(d => d.priority === 'high').length,
      medium: testData.filter(d => d.priority === 'medium').length,
      low: testData.filter(d => d.priority === 'low').length,
      planned: testData.filter(d => d.priority === 'planned').length
    }
  };
};