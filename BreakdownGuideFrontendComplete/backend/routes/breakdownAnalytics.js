/*
 * Breakdown Analytics Routes
 * KPIs, patterns, and performance metrics
 */

import express from 'express';
const router = express.Router();

// Mock data store
const getBreakdownData = () => {
  // In production, this would query the database
  return {
    depots: ['Washington', 'Riverside', 'Percy Main', 'Consett', 'Deptford', 'Hexham'],
    supervisors: ['AW001', 'AC002', 'AG003', 'CF004', 'DH005', 'JD006', 'JP007', 'SG008', 'BP009']
  };
};

// Get depot KPIs
router.get('/depot-kpis', async (req, res) => {
  try {
    const { depot, period = '7d' } = req.query;
    
    // Mock KPI data
    const kpis = {
      depot: depot || 'All Depots',
      period,
      metrics: {
        total_breakdowns: Math.floor(Math.random() * 50) + 10,
        avg_response_time: Math.floor(Math.random() * 30) + 5,
        avg_resolution_time: Math.floor(Math.random() * 90) + 30,
        repeat_breakdown_rate: (Math.random() * 0.3).toFixed(2),
        critical_breakdowns: Math.floor(Math.random() * 5),
        top_issues: [
          { type: 'Engine', count: Math.floor(Math.random() * 10) + 1 },
          { type: 'Brakes', count: Math.floor(Math.random() * 8) + 1 },
          { type: 'Electrical', count: Math.floor(Math.random() * 6) + 1 }
        ]
      },
      comparison: {
        vs_last_period: Math.random() > 0.5 ? '+' : '-' + Math.floor(Math.random() * 20) + '%',
        rank: Math.floor(Math.random() * 6) + 1,
        total_depots: 6
      }
    };
    
    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error getting depot KPIs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get depot KPIs'
    });
  }
});

// Get breakdown patterns
router.get('/patterns', async (req, res) => {
  try {
    const { fleet_number, days = 30 } = req.query;
    
    // Mock pattern data
    const patterns = {
      fleet_number: fleet_number || 'All Fleet',
      analysis_period: `${days} days`,
      patterns_detected: [
        {
          pattern_type: 'Recurring Issue',
          description: 'Brake system failures every 2-3 weeks',
          confidence: 0.85,
          affected_vehicles: ['6301', '6302', '6305'],
          recommendation: 'Schedule preventive brake maintenance'
        },
        {
          pattern_type: 'Time-based',
          description: 'Increased breakdowns during morning peak (7-9am)',
          confidence: 0.72,
          peak_times: ['07:00-09:00', '16:30-18:30'],
          recommendation: 'Deploy additional engineering support during peak hours'
        },
        {
          pattern_type: 'Location-based',
          description: 'High breakdown rate on Route X10',
          confidence: 0.68,
          hotspot_locations: ['Newcastle Central', 'Gateshead Interchange'],
          recommendation: 'Review route conditions and vehicle assignments'
        }
      ],
      risk_score: Math.floor(Math.random() * 100),
      prediction: {
        next_7_days: {
          expected_breakdowns: Math.floor(Math.random() * 15) + 5,
          confidence: 0.75
        }
      }
    };
    
    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Error getting patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze patterns'
    });
  }
});

// Get fleet health metrics
router.get('/fleet-health', async (req, res) => {
  try {
    const { depot } = req.query;
    
    // Mock fleet health data
    const fleetHealth = {
      depot: depot || 'All Depots',
      timestamp: new Date().toISOString(),
      overall_health_score: Math.floor(Math.random() * 30) + 70,
      vehicle_status: {
        operational: Math.floor(Math.random() * 400) + 100,
        in_maintenance: Math.floor(Math.random() * 20) + 5,
        breakdown: Math.floor(Math.random() * 10) + 1,
        total: 541
      },
      health_by_type: [
        { type: 'Volvo B9TL', health_score: Math.floor(Math.random() * 20) + 75 },
        { type: 'Streetdeck', health_score: Math.floor(Math.random() * 20) + 70 },
        { type: 'Solo', health_score: Math.floor(Math.random() * 20) + 65 },
        { type: 'Enviro 400', health_score: Math.floor(Math.random() * 20) + 72 }
      ],
      maintenance_due: {
        overdue: Math.floor(Math.random() * 5),
        this_week: Math.floor(Math.random() * 15) + 5,
        next_week: Math.floor(Math.random() * 20) + 10
      },
      reliability_metrics: {
        mtbf: Math.floor(Math.random() * 500) + 500, // Mean Time Between Failures (hours)
        mttr: Math.floor(Math.random() * 3) + 1, // Mean Time To Repair (hours)
        availability: (Math.random() * 0.1 + 0.9).toFixed(3) // 90-100%
      }
    };
    
    res.json({
      success: true,
      data: fleetHealth
    });
  } catch (error) {
    console.error('Error getting fleet health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get fleet health metrics'
    });
  }
});

// Get supervisor performance
router.get('/supervisor-performance', async (req, res) => {
  try {
    const { supervisor_badge, period = '30d' } = req.query;
    
    const supervisorNames = {
      'AW001': 'Alan Wilson',
      'AC002': 'Andrew Coates',
      'AG003': 'Anthony Gair',
      'CF004': 'Chris Forster',
      'DH005': 'David Hunter',
      'JD006': 'John Dobson',
      'JP007': 'John Patterson',
      'SG008': 'Steven Graham',
      'BP009': 'Brian Pears'
    };
    
    // Mock performance data
    const performance = {
      supervisor_badge: supervisor_badge || 'All Supervisors',
      supervisor_name: supervisor_badge ? supervisorNames[supervisor_badge] : 'All',
      period,
      metrics: {
        assessments_completed: Math.floor(Math.random() * 100) + 20,
        avg_assessment_time: Math.floor(Math.random() * 5) + 2,
        decision_accuracy: (Math.random() * 0.2 + 0.8).toFixed(2),
        response_time: Math.floor(Math.random() * 10) + 5,
        breakdowns_resolved: Math.floor(Math.random() * 50) + 10
      },
      decision_breakdown: {
        stop: Math.floor(Math.random() * 10),
        amber: Math.floor(Math.random() * 30) + 10,
        continue: Math.floor(Math.random() * 40) + 20
      },
      efficiency_score: Math.floor(Math.random() * 20) + 75,
      ranking: supervisor_badge ? Math.floor(Math.random() * 9) + 1 : null,
      trends: {
        improving: Math.random() > 0.3,
        change_percentage: Math.floor(Math.random() * 30) - 15
      }
    };
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Error getting supervisor performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supervisor performance'
    });
  }
});

// Get cost analysis
router.get('/cost-analysis', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Mock cost data
    const costs = {
      period,
      total_cost: Math.floor(Math.random() * 50000) + 10000,
      breakdown_costs: {
        labor: Math.floor(Math.random() * 20000) + 5000,
        parts: Math.floor(Math.random() * 15000) + 3000,
        service_disruption: Math.floor(Math.random() * 10000) + 2000,
        passenger_compensation: Math.floor(Math.random() * 5000)
      },
      cost_by_depot: [
        { depot: 'Washington', cost: Math.floor(Math.random() * 10000) + 2000 },
        { depot: 'Riverside', cost: Math.floor(Math.random() * 10000) + 2000 },
        { depot: 'Percy Main', cost: Math.floor(Math.random() * 10000) + 2000 },
        { depot: 'Consett', cost: Math.floor(Math.random() * 10000) + 2000 },
        { depot: 'Deptford', cost: Math.floor(Math.random() * 10000) + 2000 },
        { depot: 'Hexham', cost: Math.floor(Math.random() * 10000) + 2000 }
      ],
      cost_per_breakdown: Math.floor(Math.random() * 500) + 200,
      vs_budget: {
        budget: 75000,
        actual: Math.floor(Math.random() * 50000) + 10000,
        variance_percentage: Math.floor(Math.random() * 40) - 20
      },
      projected_annual: Math.floor(Math.random() * 500000) + 100000
    };
    
    res.json({
      success: true,
      data: costs
    });
  } catch (error) {
    console.error('Error getting cost analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cost analysis'
    });
  }
});

export default router;
