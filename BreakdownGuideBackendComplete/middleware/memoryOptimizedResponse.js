// backend/middleware/memoryOptimizedResponse.js
// Memory-optimized response middleware for 2GB RAM constraint

import { Transform } from 'stream';
import { createGzip } from 'zlib';

/**
 * Memory-efficient streaming response middleware
 * Handles large datasets without loading everything into memory
 */
class MemoryOptimizedResponse {
  constructor() {
    this.activeStreams = new Set();
    this.compressionCache = new Map();
    this.maxCacheSize = 100;
  }

  /**
   * Stream large JSON responses in chunks
   */
  streamJSON(res, data, options = {}) {
    const {
      chunkSize = 1000,
      compress = true,
      metadata = {}
    } = options;

    return new Promise((resolve, reject) => {
      try {
        // Set appropriate headers
        res.setHeader('Content-Type', 'application/json');
        
        if (compress) {
          res.setHeader('Content-Encoding', 'gzip');
        }

        // Create transform stream for JSON chunking
        const jsonStream = new Transform({
          objectMode: true,
          transform(chunk, encoding, callback) {
            try {
              const jsonChunk = JSON.stringify(chunk);
              callback(null, jsonChunk);
            } catch (error) {
              callback(error);
            }
          }
        });

        // Add compression if enabled
        let outputStream = jsonStream;
        if (compress) {
          const gzip = createGzip({ level: 6 }); // Moderate compression for speed
          outputStream = jsonStream.pipe(gzip);
        }

        // Track active stream
        this.activeStreams.add(outputStream);

        // Handle stream cleanup
        const cleanup = () => {
          this.activeStreams.delete(outputStream);
          data = null; // Clear reference for GC
        };

        outputStream.on('end', () => {
          cleanup();
          resolve();
        });

        outputStream.on('error', (error) => {
          cleanup();
          reject(error);
        });

        // Pipe to response
        outputStream.pipe(res);

        // Start JSON response
        jsonStream.write('{"success":true');
        
        if (Object.keys(metadata).length > 0) {
          jsonStream.write(',"metadata":' + JSON.stringify(metadata));
        }

        jsonStream.write(',"data":[');

        // Stream data in chunks
        let isFirstItem = true;
        const processChunk = (startIndex) => {
          const endIndex = Math.min(startIndex + chunkSize, data.length);
          
          for (let i = startIndex; i < endIndex; i++) {
            if (!isFirstItem) {
              jsonStream.write(',');
            }
            jsonStream.write(JSON.stringify(data[i]));
            isFirstItem = false;
            
            // Clear reference after use to help GC
            data[i] = null;
          }

          if (endIndex < data.length) {
            // Use setImmediate to prevent blocking
            setImmediate(() => processChunk(endIndex));
          } else {
            // Finish JSON response
            jsonStream.write(']}');
            jsonStream.end();
          }
        };

        // Start processing
        if (Array.isArray(data) && data.length > 0) {
          processChunk(0);
        } else {
          jsonStream.write(']}');
          jsonStream.end();
        }

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stream paginated responses
   */
  async streamPaginated(res, fetchFunction, options = {}) {
    const {
      pageSize = 100,
      totalLimit = 10000,
      compress = true
    } = options;

    try {
      res.setHeader('Content-Type', 'application/json');
      
      if (compress) {
        res.setHeader('Content-Encoding', 'gzip');
        res = res.pipe(createGzip({ level: 6 }));
      }

      let offset = 0;
      let totalProcessed = 0;
      let isFirstBatch = true;

      res.write('{"success":true,"data":[');

      while (offset < totalLimit) {
        const batch = await fetchFunction(offset, pageSize);
        
        if (!batch || batch.length === 0) {
          break;
        }

        // Write batch to response
        for (let i = 0; i < batch.length; i++) {
          if (!isFirstBatch || i > 0) {
            res.write(',');
          }
          res.write(JSON.stringify(batch[i]));
        }

        totalProcessed += batch.length;
        offset += pageSize;
        isFirstBatch = false;

        // Clear batch reference for GC
        batch.length = 0;

        // Yield control to prevent blocking
        await new Promise(resolve => setImmediate(resolve));

        // Break if we got less than expected (end of data)
        if (batch.length < pageSize) {
          break;
        }
      }

      res.write(`],"metadata":{"totalProcessed":${totalProcessed},"pageSize":${pageSize}}}`);
      res.end();

    } catch (error) {
      console.error('❌ Streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  /**
   * Memory-efficient field selection
   */
  selectFields(data, fields) {
    if (!fields || fields.length === 0) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => {
        const selected = {};
        for (const field of fields) {
          if (item.hasOwnProperty(field)) {
            selected[field] = item[field];
          }
        }
        return selected;
      });
    } else {
      const selected = {};
      for (const field of fields) {
        if (data.hasOwnProperty(field)) {
          selected[field] = data[field];
        }
      }
      return selected;
    }
  }

  /**
   * Clean up active streams
   */
  cleanup() {
    for (const stream of this.activeStreams) {
      try {
        stream.destroy();
      } catch (error) {
        console.error('❌ Stream cleanup error:', error);
      }
    }
    this.activeStreams.clear();
    this.compressionCache.clear();
  }

  /**
   * Get memory usage stats
   */
  getStats() {
    return {
      activeStreams: this.activeStreams.size,
      cacheSize: this.compressionCache.size,
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    };
  }
}

// Singleton instance
const memoryOptimizedResponse = new MemoryOptimizedResponse();

/**
 * Express middleware for memory-optimized responses
 */
export const memoryOptimizedMiddleware = (req, res, next) => {
  // Add streaming methods to response object
  res.streamJSON = (data, options) => memoryOptimizedResponse.streamJSON(res, data, options);
  res.streamPaginated = (fetchFunction, options) => memoryOptimizedResponse.streamPaginated(res, fetchFunction, options);
  res.selectFields = (data, fields) => memoryOptimizedResponse.selectFields(data, fields);

  // Add cleanup on response finish
  res.on('finish', () => {
    // Clear any request-specific data
    req.tempData = null;
    
    // Force garbage collection if available
    if (global.gc && Math.random() < 0.1) { // 10% chance to avoid overhead
      setTimeout(() => global.gc(), 100);
    }
  });

  next();
};

/**
 * Request-level memory monitoring middleware
 */
export const requestMemoryMonitor = (req, res, next) => {
  const startMemory = process.memoryUsage().heapUsed;
  const startTime = Date.now();

  res.on('finish', () => {
    const endMemory = process.memoryUsage().heapUsed;
    const duration = Date.now() - startTime;
    const memoryDelta = (endMemory - startMemory) / 1024 / 1024; // MB

    if (memoryDelta > 50 || duration > 5000) { // Log if >50MB or >5s
      console.warn(`⚠️ High memory request: ${req.method} ${req.path}`, {
        memoryDelta: `${memoryDelta.toFixed(2)}MB`,
        duration: `${duration}ms`,
        currentMemory: `${Math.round(endMemory / 1024 / 1024)}MB`
      });
    }
  });

  next();
};

/**
 * Response compression middleware
 */
export const compressionMiddleware = (req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Only compress JSON responses over 1KB
  const originalJson = res.json;
  res.json = function(data) {
    const jsonString = JSON.stringify(data);
    
    if (jsonString.length > 1024 && acceptEncoding.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      const gzip = createGzip({ level: 6 });
      
      res.setHeader('Content-Type', 'application/json');
      gzip.pipe(res);
      gzip.end(jsonString);
    } else {
      originalJson.call(this, data);
    }
  };

  next();
};

export default memoryOptimizedResponse;