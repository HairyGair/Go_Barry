// Performance Optimizer Utility
// Provides memory, processing, and resource optimization helpers

import os from 'os';
import process from 'process';

export function triggerGarbageCollection() {
  if (global.gc) {
    global.gc();
    return true;
  }
  return false;
}

export function detectMemoryLeak(threshold = 0.8) {
  const mem = process.memoryUsage();
  return mem.heapUsed / mem.heapTotal > threshold;
}

export function monitorMemoryUsage() {
  const mem = process.memoryUsage();
  return {
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    rss: mem.rss,
    external: mem.external,
    arrayBuffers: mem.arrayBuffers,
    free: os.freemem(),
    total: os.totalmem(),
  };
}

export function optimizeObjectPooling(pool) {
  // Example: clean up unused objects
  pool.cleanup && pool.cleanup();
}

export function smartCache(cache, maxSize = 1000) {
  if (cache.size > maxSize) {
    // Remove oldest entries
    const keys = Array.from(cache.keys()).slice(0, cache.size - maxSize);
    keys.forEach(k => cache.delete(k));
  }
}

export function batchProcess(items, batchSize, fn) {
  for (let i = 0; i < items.length; i += batchSize) {
    fn(items.slice(i, i + batchSize));
  }
}

export function monitorCPUUsage() {
  const cpus = os.cpus();
  return cpus.map(cpu => cpu.times);
}

export function optimizeFileIO(fs, filePath) {
  // Example: use streams for large files
  return fs.createReadStream(filePath);
}

export function optimizeNetworkRequest(requestFn, retries = 3) {
  let attempts = 0;
  const attempt = async (...args) => {
    try {
      return await requestFn(...args);
    } catch (e) {
      if (++attempts < retries) return attempt(...args);
      throw e;
    }
  };
  return attempt;
}

export function resourceCleanup(resources) {
  resources.forEach(r => r && r.close && r.close());
}

// Database status for health monitor
export function getDatabaseStatus() {
  // Simulate DB status check
  return Promise.resolve({ status: 'ok', timestamp: Date.now() });
}
