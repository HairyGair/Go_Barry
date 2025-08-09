// Test script for breakdown logging system
import express from 'express';
import breakdownRoutes from './routes/breakdowns.js';

console.log('🧪 Testing Breakdown Logging System');

const app = express();
app.use(express.json());
app.use('/api/breakdowns', breakdownRoutes);

const testData = {
  supervisorId: "AG003",
  vehicleReg: "NK67 EJS", 
  fleetNo: "12345",
  breakdownType: "Battery"
};

const server = app.listen(3002, async () => {
  console.log('🚀 Test server started');
  
  try {
    const healthRes = await fetch('http://localhost:3002/api/breakdowns/health');
    const health = await healthRes.json();
    console.log('Health:', health.success ? '✅' : '❌');
    
    const logRes = await fetch('http://localhost:3002/api/breakdowns/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const log = await logRes.json();
    console.log('Log:', log.success ? '✅' : '❌');
    console.log('Result:', log.message || log.error);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  server.close();
  process.exit(0);
});