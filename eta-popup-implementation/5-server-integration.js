// Main Server Integration for ETA System
// Add this to your backend/index.js or server.js

const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

// Import ETA system
const { router: etaRouter, initializeSocketIO } = require('./routes/etaRequestSystem');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Socket.IO with the server
const io = initializeSocketIO(server);

// Register ETA routes
app.use('/api', etaRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'ETA Request System',
        timestamp: new Date().toISOString()
    });
});

// Cron job for auto-escalation (runs every 5 minutes)
const cron = require('node-cron');

cron.schedule('*/5 * * * *', async () => {
    console.log('Running ETA escalation check...');
    try {
        const response = await fetch('http://localhost:' + PORT + '/api/eta-requests/escalate', {
            method: 'POST'
        });
        const result = await response.json();
        console.log(`Escalated ${result.escalated_count} requests`);
    } catch (error) {
        console.error('Error running escalation:', error);
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`🚀 ETA Request System running on port ${PORT}`);
    console.log(`📡 WebSocket server ready for real-time updates`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});