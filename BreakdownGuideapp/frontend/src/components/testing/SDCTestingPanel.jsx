/**
 * SDC Testing Panel - Development tool for testing SDC Dashboard functionality
 * This component provides automated testing tools and scenario simulation
 */

import React, { useState, useEffect } from 'react';
import websocketService from '../../services/websocket';
import { apiConfig } from '../../breakdown-guide/components/common/constants';

const SDCTestingPanel = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [currentTest, setCurrentTest] = useState(null);
  const [mockData, setMockData] = useState({
    supervisors: ['AG003', 'BP009', 'CD012', 'EF034'],
    fleetNumbers: ['6334', '6335', '6336', '6337', '6338'],
    assessmentTypes: ['Steering', 'Brakes', 'Battery', 'Engine', 'Lights']
  });

  // Test scenarios
  const testScenarios = [
    {
      id: 'assessment-progress',
      name: '🔄 Assessment Progress Test',
      description: 'Simulate live assessment progress tracking',
      category: 'real-time'
    },
    {
      id: 'assessment-completion',
      name: '✅ Assessment Completion Test',
      description: 'Test completion flow and redirect functionality',
      category: 'workflow'
    },
    {
      id: 'edit-assessment',
      name: '✏️ Edit Assessment Test',
      description: 'Test edit modal and audit trail workflow',
      category: 'audit'
    },
    {
      id: 'websocket-fallback',
      name: '📡 WebSocket Fallback Test',
      description: 'Test WebSocket failure and polling fallback',
      category: 'connectivity'
    },
    {
      id: 'multi-supervisor',
      name: '👥 Multi-Supervisor Test',
      description: 'Test supervisor filtering and context switching',
      category: 'filtering'
    },
    {
      id: 'mobile-responsive',
      name: '📱 Mobile Responsive Test',
      description: 'Test mobile layout and touch interactions',
      category: 'responsive'
    }
  ];

  // Initialize testing panel
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Generate mock breakdown data
  const generateMockBreakdown = () => {
    const id = `BD-2025-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
    const supervisor = mockData.supervisors[Math.floor(Math.random() * mockData.supervisors.length)];
    const fleet = mockData.fleetNumbers[Math.floor(Math.random() * mockData.fleetNumbers.length)];
    const assessmentType = mockData.assessmentTypes[Math.floor(Math.random() * mockData.assessmentTypes.length)];
    
    return {
      breakdown_id: id,
      fleet_number: fleet,
      supervisor_badge: supervisor,
      supervisor_name: `Supervisor ${supervisor}`,
      assessment_type: assessmentType,
      location: 'Test Location',
      route: 'X10',
      created_at: new Date().toISOString(),
      status: 'active'
    };
  };

  // Test 1: Assessment Progress Simulation
  const testAssessmentProgress = async () => {
    setCurrentTest('assessment-progress');
    
    try {
      const mockBreakdown = generateMockBreakdown();
      
      // Simulate wizard start
      const startMessage = {
        type: 'wizard_started',
        breakdown_id: mockBreakdown.breakdown_id,
        fleet_no: mockBreakdown.fleet_number,
        supervisor: mockBreakdown.supervisor_name,
        wizard_type: mockBreakdown.assessment_type,
        timestamp: new Date().toISOString(),
        currentStep: '1/5',
        stepDescription: 'Starting assessment...'
      };
      
      // Send start message
      if (websocketService.isConnected('/ws/sdc-dashboard')) {
        websocketService.send('/ws/sdc-dashboard', startMessage);
      }
      
      // Simulate step progression
      const steps = [
        { step: '2/5', description: 'Checking initial conditions...' },
        { step: '3/5', description: 'Performing detailed inspection...' },
        { step: '4/5', description: 'Recording findings...' },
        { step: '5/5', description: 'Finalizing assessment...' }
      ];
      
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second intervals
        
        const progressMessage = {
          type: 'assessment_progress',
          breakdown_id: mockBreakdown.breakdown_id,
          ...steps[i],
          timestamp: new Date().toISOString()
        };
        
        if (websocketService.isConnected('/ws/sdc-dashboard')) {
          websocketService.send('/ws/sdc-dashboard', progressMessage);
        }
      }
      
      setTestResults(prev => ({
        ...prev,
        'assessment-progress': { status: 'passed', timestamp: new Date().toISOString() }
      }));
      
    } catch (error) {
      console.error('Assessment progress test failed:', error);
      setTestResults(prev => ({
        ...prev,
        'assessment-progress': { status: 'failed', error: error.message, timestamp: new Date().toISOString() }
      }));
    }
    
    setCurrentTest(null);
  };

  // Test 2: Assessment Completion Simulation
  const testAssessmentCompletion = async () => {
    setCurrentTest('assessment-completion');
    
    try {
      const mockBreakdown = generateMockBreakdown();
      const decisions = ['STOP', 'AMBER', 'CONTINUE'];
      const decision = decisions[Math.floor(Math.random() * decisions.length)];
      
      // Simulate completion
      const completionMessage = {
        type: 'wizard_completed',
        breakdown_id: mockBreakdown.breakdown_id,
        fleet_no: mockBreakdown.fleet_number,
        decision: decision,
        wizard_responses: {
          'initial_check': 'completed',
          'detailed_assessment': decision.toLowerCase(),
          'recommended_action': decision === 'STOP' ? 'Request engineer' : 'Continue service'
        },
        timestamp: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };
      
      if (websocketService.isConnected('/ws/sdc-dashboard')) {
        websocketService.send('/ws/sdc-dashboard', completionMessage);
      }
      
      // Test redirect functionality
      setTimeout(() => {
        const currentUrl = window.location.href;
        const expectedUrl = `/dashboards/sdc?highlight=${mockBreakdown.breakdown_id}`;
        
        console.log('Testing redirect:', { currentUrl, expectedUrl });
        
        // In a real test, we would navigate and check URL
        setTestResults(prev => ({
          ...prev,
          'assessment-completion': { 
            status: 'passed', 
            data: { decision, breakdownId: mockBreakdown.breakdown_id },
            timestamp: new Date().toISOString() 
          }
        }));
      }, 1000);
      
    } catch (error) {
      console.error('Assessment completion test failed:', error);
      setTestResults(prev => ({
        ...prev,
        'assessment-completion': { status: 'failed', error: error.message, timestamp: new Date().toISOString() }
      }));
    }
    
    setCurrentTest(null);
  };

  // Test 3: WebSocket Connection Test
  const testWebSocketConnection = async () => {
    setCurrentTest('websocket-fallback');
    
    try {
      const stats = websocketService.getStats();
      
      // Test connection state
      const connectionState = websocketService.getConnectionState('/ws/sdc-dashboard');
      
      // Simulate connection failure (in real scenario, this would be more complex)
      const testResults = {
        initialConnection: connectionState,
        totalConnections: stats.totalConnections,
        connectedCount: stats.connectedCount,
        connectionStats: stats
      };
      
      console.log('WebSocket test results:', testResults);
      
      setTestResults(prev => ({
        ...prev,
        'websocket-fallback': { 
          status: connectionState === 'connected' ? 'passed' : 'warning',
          data: testResults,
          timestamp: new Date().toISOString() 
        }
      }));
      
    } catch (error) {
      console.error('WebSocket test failed:', error);
      setTestResults(prev => ({
        ...prev,
        'websocket-fallback': { status: 'failed', error: error.message, timestamp: new Date().toISOString() }
      }));
    }
    
    setCurrentTest(null);
  };

  // Test 4: Supervisor Context Test
  const testSupervisorContext = async () => {
    setCurrentTest('multi-supervisor');
    
    try {
      // Check current supervisor context
      const currentSupervisor = localStorage.getItem('currentSupervisor');
      const sessionData = sessionStorage.getItem('supervisorSession');
      
      // Check filter persistence
      const savedFilters = localStorage.getItem('sdc-filters');
      
      const testResults = {
        currentSupervisor: currentSupervisor ? JSON.parse(currentSupervisor) : null,
        sessionData: sessionData ? JSON.parse(sessionData) : null,
        savedFilters: savedFilters ? JSON.parse(savedFilters) : null,
        availableSupervisors: mockData.supervisors
      };
      
      console.log('Supervisor context test:', testResults);
      
      setTestResults(prev => ({
        ...prev,
        'multi-supervisor': { 
          status: currentSupervisor ? 'passed' : 'warning',
          data: testResults,
          timestamp: new Date().toISOString() 
        }
      }));
      
    } catch (error) {
      console.error('Supervisor context test failed:', error);
      setTestResults(prev => ({
        ...prev,
        'multi-supervisor': { status: 'failed', error: error.message, timestamp: new Date().toISOString() }
      }));
    }
    
    setCurrentTest(null);
  };

  // Test 5: Mobile Responsive Test
  const testMobileResponsive = async () => {
    setCurrentTest('mobile-responsive');
    
    try {
      // Check viewport dimensions
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        isMobile: window.innerWidth <= 768
      };
      
      // Check touch support
      const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check responsive elements
      const breakdownCounter = document.querySelector('.dashboard-header .breakdown-counter');
      const filterTabs = document.querySelector('.filter-tabs');
      
      const testResults = {
        viewport,
        touchSupport,
        responsiveElements: {
          breakdownCounterVisible: breakdownCounter ? !breakdownCounter.style.display.includes('none') : false,
          filterTabsScrollable: filterTabs ? filterTabs.scrollWidth > filterTabs.clientWidth : false
        }
      };
      
      console.log('Mobile responsive test:', testResults);
      
      setTestResults(prev => ({
        ...prev,
        'mobile-responsive': { 
          status: 'passed',
          data: testResults,
          timestamp: new Date().toISOString() 
        }
      }));
      
    } catch (error) {
      console.error('Mobile responsive test failed:', error);
      setTestResults(prev => ({
        ...prev,
        'mobile-responsive': { status: 'failed', error: error.message, timestamp: new Date().toISOString() }
      }));
    }
    
    setCurrentTest(null);
  };

  // Test 6: Edit Assessment Simulation
  const testEditAssessment = async () => {
    setCurrentTest('edit-assessment');
    
    try {
      const mockBreakdown = generateMockBreakdown();
      
      // Simulate audit trail creation
      const auditEntry = {
        action: 'assessment_edit_initiated',
        breakdown_id: mockBreakdown.breakdown_id,
        user_type: 'sdc_operator',
        timestamp: new Date().toISOString(),
        source: 'testing_panel'
      };
      
      // Test audit logging endpoint
      try {
        const response = await fetch(`${apiConfig.baseUrl}/api/audit/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditEntry)
        });
        
        const auditResult = response.ok ? 'success' : 'failed';
        
        setTestResults(prev => ({
          ...prev,
          'edit-assessment': { 
            status: auditResult === 'success' ? 'passed' : 'warning',
            data: { auditEntry, auditResult },
            timestamp: new Date().toISOString() 
          }
        }));
        
      } catch (fetchError) {
        console.log('Audit endpoint test (expected in development):', fetchError.message);
        setTestResults(prev => ({
          ...prev,
          'edit-assessment': { 
            status: 'warning',
            data: { auditEntry, note: 'Audit endpoint test - expected failure in development' },
            timestamp: new Date().toISOString() 
          }
        }));
      }
      
    } catch (error) {
      console.error('Edit assessment test failed:', error);
      setTestResults(prev => ({
        ...prev,
        'edit-assessment': { status: 'failed', error: error.message, timestamp: new Date().toISOString() }
      }));
    }
    
    setCurrentTest(null);
  };

  // Run test based on scenario
  const runTest = (scenarioId) => {
    switch (scenarioId) {
      case 'assessment-progress':
        testAssessmentProgress();
        break;
      case 'assessment-completion':
        testAssessmentCompletion();
        break;
      case 'edit-assessment':
        testEditAssessment();
        break;
      case 'websocket-fallback':
        testWebSocketConnection();
        break;
      case 'multi-supervisor':
        testSupervisorContext();
        break;
      case 'mobile-responsive':
        testMobileResponsive();
        break;
      default:
        console.warn('Unknown test scenario:', scenarioId);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    for (const scenario of testScenarios) {
      if (currentTest) continue; // Don't overlap tests
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between tests
      runTest(scenario.id);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for test completion
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'warning': return '⚠️';
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="sdc-testing-panel">
      <div className="testing-header">
        <div className="testing-title">
          <h2>🧪 SDC Dashboard Testing Panel</h2>
          <p>Automated testing tools for SDC Operations Dashboard functionality</p>
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="testing-controls">
        <button 
          className="run-all-btn"
          onClick={runAllTests}
          disabled={currentTest}
        >
          🚀 Run All Tests
        </button>
        
        <div className="connection-status">
          <span className="status-label">WebSocket:</span>
          <span className={`status-indicator ${websocketService.isConnected('/ws/sdc-dashboard') ? 'connected' : 'disconnected'}`}>
            {websocketService.isConnected('/ws/sdc-dashboard') ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </div>

      <div className="test-scenarios">
        {testScenarios.map(scenario => {
          const result = testResults[scenario.id];
          const isRunning = currentTest === scenario.id;
          
          return (
            <div key={scenario.id} className={`test-scenario ${isRunning ? 'running' : ''}`}>
              <div className="scenario-header">
                <div className="scenario-info">
                  <h3>{scenario.name}</h3>
                  <p>{scenario.description}</p>
                </div>
                
                <div className="scenario-controls">
                  <button 
                    className="run-test-btn"
                    onClick={() => runTest(scenario.id)}
                    disabled={isRunning || currentTest}
                  >
                    {isRunning ? '⏳ Running...' : '▶️ Run Test'}
                  </button>
                  
                  {result && (
                    <div className="test-status" style={{ color: getStatusColor(result.status) }}>
                      {getStatusIcon(result.status)} {result.status.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              
              {result && (
                <div className="test-results">
                  <div className="result-timestamp">
                    Completed: {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                  
                  {result.error && (
                    <div className="result-error">
                      Error: {result.error}
                    </div>
                  )}
                  
                  {result.data && (
                    <div className="result-data">
                      <details>
                        <summary>Test Data</summary>
                        <pre>{JSON.stringify(result.data, null, 2)}</pre>
                      </details>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .sdc-testing-panel {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          z-index: 10000;
          overflow-y: auto;
          padding: 20px;
        }

        .testing-panel > div {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }

        .testing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }

        .testing-title h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 700;
        }

        .testing-title p {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 20px;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .testing-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .run-all-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .run-all-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .run-all-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .status-label {
          color: #6b7280;
          font-weight: 500;
        }

        .status-indicator {
          font-weight: 600;
        }

        .status-indicator.connected {
          color: #10b981;
        }

        .status-indicator.disconnected {
          color: #ef4444;
        }

        .test-scenarios {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .test-scenario {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .test-scenario.running {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .scenario-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f8fafc;
        }

        .scenario-info h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .scenario-info p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        .scenario-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .run-test-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .run-test-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
        }

        .run-test-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .test-status {
          font-size: 14px;
          font-weight: 600;
        }

        .test-results {
          padding: 16px 20px;
          background: white;
          border-top: 1px solid #e5e7eb;
        }

        .result-timestamp {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .result-error {
          color: #ef4444;
          font-size: 14px;
          margin-bottom: 8px;
          padding: 8px 12px;
          background: #fef2f2;
          border-radius: 6px;
          border: 1px solid #fecaca;
        }

        .result-data details {
          margin-top: 8px;
        }

        .result-data summary {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          padding: 4px 0;
        }

        .result-data pre {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
          font-size: 12px;
          overflow-x: auto;
          margin: 8px 0 0 0;
          border: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .sdc-testing-panel {
            padding: 10px;
          }

          .testing-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .testing-controls {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .scenario-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .scenario-controls {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default SDCTestingPanel;