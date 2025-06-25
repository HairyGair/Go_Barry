// Alert Processing Optimizer Service
// Enhances alert processing with memory-efficient, high-performance strategies

import { processAlertsStream, getAlertDeduplicationStats } from './enhancedAlertProcessor.js';
import { getMLPredictions } from './intelligenceEngine.js';
import { syncAlertQueue } from './convexSync.js';

const alertCache = new Map();

export async function optimizeAlertProcessing(alerts) {
  // Streaming processing for memory efficiency
  for await (const alert of processAlertsStream(alerts)) {
    // Deduplication and caching
    if (!alertCache.has(alert.id)) {
      alertCache.set(alert.id, alert);
      // ML prediction integration
      alert.ml = await getMLPredictions(alert);
    }
  }
  // Sync with Convex
  await syncAlertQueue(Array.from(alertCache.values()));
  return { processed: alertCache.size };
}

export function clearAlertCache() {
  alertCache.clear();
}

export function getAlertProcessingStats() {
  return {
    cacheSize: alertCache.size,
    deduplication: getAlertDeduplicationStats(),
  };
}

export default {
  optimizeAlertProcessing,
  clearAlertCache,
  getAlertProcessingStats,
};
