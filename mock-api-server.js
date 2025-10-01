// Mock API Server for Go North East Breakdown Guide
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3002;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from current directory (for frontend)
app.use(express.static('.'));

// Mock data
const mockSupervisors = [
    { badge: 'AG003', name: 'Anthony Gair', assessments: 45, avgTime: '2m 30s', accuracy: '98%' },
    { badge: 'AW001', name: 'Alex Wilson', assessments: 32, avgTime: '3m 15s', accuracy: '95%' },
    { badge: 'AC002', name: 'Amy Clarke', assessments: 28, avgTime: '2m 45s', accuracy: '97%' },
    { badge: 'CF004', name: 'Chris Foster', assessments: 51, avgTime: '2m 20s', accuracy: '99%' },
    { badge: 'DH005', name: 'David Hughes', assessments: 38, avgTime: '2m 55s', accuracy: '96%' }
];

const mockDepots = [
    { name: 'Washington', breakdowns: 12, avgResponse: '18m', onTime: '94%' },
    { name: 'Chester-le-Street', breakdowns: 8, avgResponse: '22m', onTime: '91%' },
    { name: 'Hexham', breakdowns: 6, avgResponse: '25m', onTime: '89%' },
    { name: 'Consett', breakdowns: 10, avgResponse: '20m', onTime: '92%' },
    { name: 'Stanley', breakdowns: 7, avgResponse: '19m', onTime: '93%' },
    { name: 'Peterlee', breakdowns: 9, avgResponse: '21m', onTime: '90%' }
];

const mockBreakdowns = [
    {
        id: 'BD-2025-00001',
        vehicle: '6301',
        route: 'X21',
        issue: 'Steering issue',
        status: 'resolved',
        supervisor: 'AG003',
        location: 'Newcastle Central',
        timestamp: new Date().toISOString(),
        severity: 'AMBER'
    },
    {
        id: 'BD-2025-00002', 
        vehicle: '5847',
        route: '21',
        issue: 'Brake warning light',
        status: 'active',
        supervisor: 'AW001',
        location: 'Durham Bus Station',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        severity: 'STOP'
    }
];

// API Routes
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'Go North East Breakdown Guide API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/supervisor-performance', (req, res) => {
    res.json({
        success: true,
        data: mockSupervisors,
        timestamp: new Date().toISOString()
    });
});

app.get('/depot-performance', (req, res) => {
    res.json({
        success: true,
        data: mockDepots,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/breakdowns/live', (req, res) => {
    res.json({
        success: true,
        data: mockBreakdowns,
        count: mockBreakdowns.length,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/breakdowns/:id', (req, res) => {
    const breakdown = mockBreakdowns.find(b => b.id === req.params.id);
    if (breakdown) {
        res.json({ success: true, data: breakdown });
    } else {
        res.status(404).json({ success: false, error: 'Breakdown not found' });
    }
});

app.post('/api/breakdowns', (req, res) => {
    const newBreakdown = {
        id: `BD-2025-${String(mockBreakdowns.length + 1).padStart(5, '0')}`,
        vehicle: req.body.vehicle || 'Unknown',
        route: req.body.route || 'Unknown',
        issue: req.body.issue || 'Unknown issue',
        status: 'active',
        supervisor: req.body.supervisor || 'Unknown',
        location: req.body.location || 'Unknown',
        timestamp: new Date().toISOString(),
        severity: req.body.severity || 'AMBER'
    };
    
    mockBreakdowns.push(newBreakdown);
    res.json({ success: true, data: newBreakdown });
});

app.put('/api/breakdowns/:id', (req, res) => {
    const index = mockBreakdowns.findIndex(b => b.id === req.params.id);
    if (index !== -1) {
        mockBreakdowns[index] = { ...mockBreakdowns[index], ...req.body };
        res.json({ success: true, data: mockBreakdowns[index] });
    } else {
        res.status(404).json({ success: false, error: 'Breakdown not found' });
    }
});

app.get('/api/fleet/:vehicleId', (req, res) => {
    const vehicleId = req.params.vehicleId;
    res.json({
        success: true,
        data: {
            fleet_number: vehicleId,
            manufacturer: 'Volvo',
            model: 'B9TL',
            year: 2019,
            depot: 'Washington',
            status: 'active'
        }
    });
});

// Catch-all for unhandled routes
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/health') || req.path.includes('performance')) {
        res.status(404).json({ 
            success: false, 
            error: `Endpoint ${req.path} not found`,
            availableEndpoints: [
                '/health',
                '/supervisor-performance', 
                '/depot-performance',
                '/api/breakdowns/live',
                '/api/breakdowns/:id',
                '/api/fleet/:vehicleId'
            ]
        });
    } else {
        res.sendFile(path.join(process.cwd(), 'index.html'), (err) => {
            if (err) {
                res.status(404).send('File not found');
            }
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Mock API Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}/sdc-operations-dashboard.html`);
    console.log(`🔧 Breakdown Guide at http://localhost:${PORT}/breakdown-guide/index-modern.html`);
    console.log(`📡 API endpoints available:`);
    console.log(`   • GET  /health`);
    console.log(`   • GET  /supervisor-performance`);
    console.log(`   • GET  /depot-performance`);
    console.log(`   • GET  /api/breakdowns/live`);
    console.log(`   • POST /api/breakdowns`);
    console.log(`   • GET  /api/fleet/:vehicleId`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down mock API server...');
    process.exit(0);
});
