// QUICK COPY-PASTE FOR backend/index.js
// Add these snippets to your existing index.js file

// ========================================
// 1. ADD THESE IMPORTS AT THE TOP
// ========================================
import http from 'http';
import cron from 'node-cron';

// ========================================
// 2. AFTER: const app = express();
// ADD THIS:
// ========================================
// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Load ETA system
try {
  const { router: etaRouter, initializeSocketIO } = await import('./routes/etaRequestSystem.js');
  
  // Initialize Socket.IO
  const io = initializeSocketIO(server);
  
  // Register ETA routes
  app.use('/api', etaRouter);
  console.log('✅ ETA Request System routes registered');
  
  // Auto-escalation cron job (runs every 5 minutes)
  cron.schedule('*/5 * * * *', async () => {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/eta-requests/escalate`, {
        method: 'POST'
      });
      const result = await response.json();
      console.log(`ETA Escalation: ${result.escalated_count || 0} requests escalated`);
    } catch (error) {
      console.error('ETA Escalation error:', error.message);
    }
  });
} catch (error) {
  console.error('❌ Failed to load ETA system:', error.message);
  console.log('⚠️ Server starting without ETA system');
}

// ========================================
// 3. AT THE BOTTOM, REPLACE app.listen WITH:
// ========================================
// CHANGE FROM: app.listen(PORT, () => {
// TO: server.listen(PORT, () => {

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔧 Engineering Dashboard: http://localhost:${PORT}/engineering-eta-dashboard.html`);
  console.log(`📞 SDC Dashboard: http://localhost:${PORT}/enhanced-breakdown-dashboard.html`);
});