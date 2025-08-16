// backend/routes/vixAPI.js
// Handle VIX late runners data uploads

import express from 'express';
import * as XLSX from 'xlsx';

const router = express.Router();

// POST /api/vix/upload - Process VIX late runners file (base64 encoded)
router.post('/upload', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { fileData, fileName } = req.body;
    
    if (!fileData) {
      return res.status(400).json({
        success: false,
        error: 'No file data received'
      });
    }

    console.log('📊 Processing VIX file:', fileName || 'unnamed.xls');

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Process late runners
    const lateRunners = [];
    let earlyOpsFound = false;

    // Data starts at row 1 (0-indexed)
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      
      // Check for section breaks
      if (row[0] === 'Early Ops' || row[0] === 'Public Service Overview') {
        break;
      }
      
      // Parse late runner data (columns: Fleet No, Service, Depot, RB, Stop, Driver No, Lateness)
      if (row[0] && row[1] && row[6]) {
        const lateness = row[6].toString();
        let delayMinutes = 0;
        
        // Parse time format (HH:MM:SS)
        if (lateness.includes(':')) {
          const parts = lateness.split(':');
          delayMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        
        lateRunners.push({
          fleetNo: row[0],
          service: row[1],
          depot: row[2],
          rb: row[3],
          stop: row[4] || 'Unknown location',
          driverNo: row[5],
          lateness: lateness,
          delayMinutes: delayMinutes
        });
      }
    }

    console.log(`✅ Processed ${lateRunners.length} late runners`);

    // Calculate statistics
    const stats = {
      totalLateRunners: lateRunners.length,
      criticalDelays: lateRunners.filter(lr => lr.delayMinutes >= 20).length,
      averageDelay: Math.round(
        lateRunners.reduce((sum, lr) => sum + lr.delayMinutes, 0) / lateRunners.length
      ),
      worstDelay: Math.max(...lateRunners.map(lr => lr.delayMinutes))
    };

    res.json({
      success: true,
      lateRunners,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ VIX processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process VIX file'
    });
  }
});

// GET /api/vix/status - Get current VIX data status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'VIX API is operational',
    features: [
      'Excel file upload support',
      'Late runners extraction',
      'Delay calculations',
      'Real-time statistics'
    ]
  });
});

export default router;