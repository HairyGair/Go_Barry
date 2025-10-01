// Add this to your backend/index.js file
// Location: /Users/anthony/Go BARRY App/backend/index.js

// ============================================
// STEP 1: Add these imports at the top of the file (after other requires)
// ============================================

const http = require('http');
const { router: etaRouter, initializeSocketIO } = require('./routes/etaRequestSystem');

// ============================================
// STEP 2: Replace your current app.listen with this
// ============================================

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO with the server
const io = initializeSocketIO(server);

// ============================================
// STEP 3: Add the ETA routes (after other route registrations)
// ============================================

// ETA Request System Routes
app.use('/api', etaRouter);
console.log('✅ ETA Request System routes registered');

// ============================================
// STEP 4: Add cron job for auto-escalation (before server.listen)
// ============================================

// Auto-escalation cron job (runs every 5 minutes)
const cron = require('node-cron');

cron.schedule('*/5 * * * *', async () => {
    console.log('Running ETA escalation check...');
    try {
        const response = await fetch(`http://localhost:${PORT}/api/eta-requests/escalate`, {
            method: 'POST'
        });
        const result = await response.json();
        console.log(`Escalated ${result.escalated_count || 0} requests`);
    } catch (error) {
        console.error('Error running escalation:', error);
    }
});

// ============================================
// STEP 5: Replace app.listen with server.listen
// ============================================

// REPLACE THIS:
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

// WITH THIS:
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready for ETA requests`);
    console.log(`🔧 Engineering Dashboard: http://localhost:${PORT}/engineering-eta-dashboard.html`);
    console.log(`📞 SDC Dashboard: http://localhost:${PORT}/enhanced-breakdown-dashboard.html`);
});

// ============================================
// FULL EXAMPLE OF WHAT YOUR INDEX.JS SHOULD LOOK LIKE
// ============================================

/*
// Existing requires...
const express = require('express');
const cors = require('cors');
const http = require('http'); // ADD THIS
require('dotenv').config();

// Import ETA system - ADD THIS
const { router: etaRouter, initializeSocketIO } = require('./routes/etaRequestSystem');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create HTTP server - ADD THIS
const server = http.createServer(app);

// Initialize Socket.IO - ADD THIS
const io = initializeSocketIO(server);

// Your existing routes...
// app.use('/api/breakdowns', breakdownRoutes);
// etc...

// ETA Request System Routes - ADD THIS
app.use('/api', etaRouter);

// Auto-escalation cron job - ADD THIS
const cron = require('node-cron');
cron.schedule('*/5 * * * *', async () => {
    console.log('Running ETA escalation check...');
    try {
        const response = await fetch(`http://localhost:${PORT}/api/eta-requests/escalate`, {
            method: 'POST'
        });
        const result = await response.json();
        console.log(`Escalated ${result.escalated_count || 0} requests`);
    } catch (error) {
        console.error('Error running escalation:', error);
    }
});

const PORT = process.env.PORT || 3001;

// IMPORTANT: Use server.listen instead of app.listen
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready for ETA requests`);
});
*/