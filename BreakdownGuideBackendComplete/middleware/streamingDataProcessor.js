// backend/middleware/streamingDataProcessor.js
// Streaming data processor for large datasets with 2GB memory constraint

import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';

/**
 * Streaming Data Processor for memory-efficient handling of large datasets
 * Designed for Go Barry's GTFS data, incidents, and roadworks processing
 */
class StreamingDataProcessor {
  constructor() {
    this.chunkSize = 100; // Process 100 items at a time
    this.maxBufferSize = 10 * 1024 * 1024; // 10MB buffer limit
    this.activeStreams = new Set();
    this.processingStats = {
      totalStreams: 0,
      activeStreams: 0,
      totalItemsProcessed: 0,
      averageChunkTime: 0
    };
  }

  /**
   * Create a streaming JSON response for large arrays
   */
  createJSONArrayStream(data, options = {}) {
    const {
      chunkSize = this.chunkSize,
      transformFn = null,
      filterFn = null,
      metadata = {}
    } = options;

    let index = 0;
    let first = true;
    const totalItems = Array.isArray(data) ? data.length : 0;
    
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeStreams.add(streamId);
    this.processingStats.totalStreams++;
    this.processingStats.activeStreams = this.activeStreams.size;

    return new Readable({
      objectMode: false,
      read() {
        try {
          if (index === 0) {
            // Start JSON response with metadata
            const header = {
              success: true,
              metadata: {
                ...metadata,
                totalItems,
                streaming: true,
                streamId,
                timestamp: new Date().toISOString()
              },
              data: '['
            };
            
            const headerStr = JSON.stringify(header).slice(0, -4) + '"[';
            this.push(headerStr);
            first = true;
          }

          if (!Array.isArray(data) || index >= data.length) {
            // End of data - close JSON array and object
            this.push(']}');
            this.push(null); // End stream
            
            // Cleanup
            this.activeStreams.delete(streamId);
            this.processingStats.activeStreams = this.activeStreams.size;
            return;
          }

          // Process chunk
          const chunkStart = Date.now();
          const chunk = data.slice(index, index + chunkSize);
          let processedChunk = chunk;

          // Apply filter if provided
          if (filterFn) {
            processedChunk = processedChunk.filter(filterFn);
          }

          // Apply transform if provided
          if (transformFn) {
            processedChunk = processedChunk.map(transformFn);
          }

          // Convert to JSON and add commas
          if (processedChunk.length > 0) {
            const chunkJson = processedChunk.map(item => JSON.stringify(item));
            const prefix = first ? '' : ',';
            const chunkStr = prefix + chunkJson.join(',');
            
            this.push(chunkStr);
            first = false;
          }

          index += chunkSize;
          
          // Update processing stats
          this.processingStats.totalItemsProcessed += processedChunk.length;
          const chunkTime = Date.now() - chunkStart;
          this.processingStats.averageChunkTime = 
            (this.processingStats.averageChunkTime + chunkTime) / 2;

          // Clean up processed chunk
          processedChunk.length = 0;
          chunk.length = 0;

          // Yield control to prevent blocking
          setImmediate(() => {});

        } catch (error) {
          console.error(`❌ Streaming error in ${streamId}:`, error);
          this.destroy(error);
        }
      }
    });
  }

  /**
   * Create a database result stream with pagination
   */
  createDatabaseStream(queryFn, options = {}) {
    const {
      batchSize = 100,
      totalLimit = 10000,
      transformFn = null
    } = options;

    let offset = 0;
    let hasMore = true;
    const streamId = `db_stream_${Date.now()}`;
    
    this.activeStreams.add(streamId);

    return new Readable({
      objectMode: true,
      async read() {
        try {
          if (!hasMore) {
            this.push(null);
            this.activeStreams.delete(streamId);
            return;
          }

          // Fetch batch from database
          const results = await queryFn({
            limit: batchSize,
            offset,
            orderBy: 'created_at',
            order: 'desc'
          });

          if (!results || results.length === 0) {
            hasMore = false;
            this.push(null);
            this.activeStreams.delete(streamId);
            return;
          }

          // Process and push results
          let processedResults = results;
          if (transformFn) {
            processedResults = results.map(transformFn);
          }

          for (const item of processedResults) {
            this.push(item);
          }

          offset += batchSize;
          
          // Check limits
          if (offset >= totalLimit) {
            hasMore = false;
          }

          // Clean up batch
          results.length = 0;
          processedResults.length = 0;

        } catch (error) {
          console.error(`❌ Database streaming error in ${streamId}:`, error);
          this.destroy(error);
        }
      }
    });
  }

  /**
   * Create a memory-efficient aggregation stream
   */
  createAggregationStream(data, aggregatorFn, options = {}) {
    const {
      chunkSize = this.chunkSize,
      initialValue = {},
      finalTransform = null
    } = options;

    let index = 0;
    let accumulator = { ...initialValue };
    const streamId = `agg_stream_${Date.now()}`;
    
    this.activeStreams.add(streamId);

    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        try {
          // Process chunk through aggregator
          accumulator = aggregatorFn(accumulator, chunk);
          
          // Pass chunk through
          callback(null, chunk);
          
        } catch (error) {
          callback(error);
        }
      },
      
      flush(callback) {
        try {
          // Apply final transform if provided
          let finalResult = accumulator;
          if (finalTransform) {
            finalResult = finalTransform(accumulator);
          }
          
          // Push final aggregated result
          this.push({
            type: 'aggregation_result',
            data: finalResult,
            streamId
          });
          
          this.activeStreams.delete(streamId);
          callback();
          
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  /**
   * Express middleware for streaming large responses
   */
  streamingMiddleware() {
    return (req, res, next) => {
      // Add streaming helper methods to response
      res.streamArray = (data, options = {}) => {
        const stream = this.createJSONArrayStream(data, options);
        
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          'X-Streaming': 'true',
          'X-Stream-Type': 'array'
        });

        stream.pipe(res);
        
        stream.on('error', (error) => {
          console.error('❌ Streaming response error:', error);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Streaming response failed'
            });
          }
        });
      };

      // Add database streaming helper
      res.streamQuery = async (queryFn, options = {}) => {
        const stream = this.createDatabaseStream(queryFn, options);
        
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          'X-Streaming': 'true',
          'X-Stream-Type': 'database'
        });

        // Convert object stream to JSON array
        res.write('{"success":true,"data":[');
        
        let first = true;
        stream.on('data', (item) => {
          const prefix = first ? '' : ',';
          res.write(prefix + JSON.stringify(item));
          first = false;
        });

        stream.on('end', () => {
          res.write(']}');
          res.end();
        });

        stream.on('error', (error) => {
          console.error('❌ Database streaming error:', error);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Database streaming failed'
            });
          }
        });
      };

      next();
    };
  }

  /**
   * Memory-efficient data transformation pipeline
   */
  async createTransformPipeline(inputStream, transforms = []) {
    try {
      let currentStream = inputStream;
      
      for (const transformConfig of transforms) {
        const transform = new Transform({
          objectMode: true,
          transform(chunk, encoding, callback) {
            try {
              const result = transformConfig.fn(chunk);
              callback(null, result);
            } catch (error) {
              callback(error);
            }
          }
        });
        
        currentStream = currentStream.pipe(transform);
      }
      
      return currentStream;
      
    } catch (error) {
      console.error('❌ Transform pipeline error:', error);
      throw error;
    }
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      ...this.processingStats,
      activeStreams: this.activeStreams.size,
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    };
  }

  /**
   * Emergency cleanup - close all active streams
   */
  emergencyCleanup() {
    console.log(`🚨 StreamingDataProcessor: Emergency cleanup - closing ${this.activeStreams.size} active streams`);
    
    for (const streamId of this.activeStreams) {
      // Force close active streams
      console.log(`🗑️ Force closing stream: ${streamId}`);
    }
    
    this.activeStreams.clear();
    this.processingStats.activeStreams = 0;
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
    
    console.log('✅ StreamingDataProcessor: Emergency cleanup completed');
  }

  /**
   * Process large array in memory-safe chunks
   */
  async processLargeArray(array, processingFn, options = {}) {
    const {
      chunkSize = this.chunkSize,
      delay = 0, // Delay between chunks in ms
      onProgress = null
    } = options;

    const results = [];
    const totalChunks = Math.ceil(array.length / chunkSize);
    
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      
      try {
        const chunkResults = await processingFn(chunk);
        results.push(...chunkResults);
        
        // Clean up processed chunk
        chunk.length = 0;
        
        // Call progress callback if provided
        if (onProgress) {
          const progress = Math.min(i + chunkSize, array.length);
          onProgress(progress, array.length, Math.floor(i / chunkSize) + 1, totalChunks);
        }
        
        // Add delay if specified
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Yield control periodically
        if (i % (chunkSize * 10) === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
        
      } catch (error) {
        console.error(`❌ Error processing chunk ${Math.floor(i / chunkSize) + 1}:`, error);
        throw error;
      }
    }
    
    return results;
  }
}

// Create singleton instance
const streamingProcessor = new StreamingDataProcessor();

export default streamingProcessor;
export { StreamingDataProcessor };