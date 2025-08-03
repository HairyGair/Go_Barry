// backend/quickFix.js
// Quick fix to add to the unified endpoint

// Add this to the /api/roadworks/unified endpoint after fetching roadworks:

// QUICK FIX: Limit to 100 roadworks to prevent memory/processing issues
if (roadworks.length > 100) {
  console.log(`⚠️ Limiting roadworks from ${roadworks.length} to 100 to prevent crashes`);
  roadworks = roadworks.slice(0, 100);
}

// Also wrap the entire processing in a try-catch
try {
  // Process coordinates...
} catch (processingError) {
  console.error('⚠️ Coordinate processing failed, returning raw data:', processingError.message);
  // Return raw data without coordinate processing
  return res.json({
    success: true,
    data: roadworks,
    metadata: {
      count: roadworks.length,
      source: 'supabase_streetworks',
      coordinateProcessing: 'failed',
      error: processingError.message
    }
  });
}
