// backend/services/streamingResponse.js
// Streaming response system for large datasets

import { Transform } from 'stream';

class StreamingResponseService {
  // Create streaming middleware
  static streamingMiddleware() {
    return (req, res, next) => {
      // Add streaming helpers to response object
      res.streamJSON = (generator) => this.streamJSON(res, generator);
      res.streamPaginated = (fetcher, options) => this.streamPaginated(res, fetcher, options);
      next();
    };
  }

  // Stream JSON objects as array
  static async streamJSON(res, dataGenerator) {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'X-Stream': 'true',
      'Cache-Control': 'no-cache'
    });

    res.write('{"success":true,"data":[');
    
    let first = true;
    let count = 0;
    
    try {
      for await (const item of dataGenerator) {
        if (!first) res.write(',');
        res.write(JSON.stringify(item));
        first = false;
        count++;
        
        // Yield control periodically to prevent blocking
        if (count % 10 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
      
      res.write(`],"count":${count},"streamed":true}`);
      res.end();
      
      console.log(`📡 Streamed ${count} items successfully`);
    } catch (error) {
      console.error('❌ Streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      } else {
        res.write(`],"error":"${error.message}","count":${count}}`);
        res.end();
      }
    }
  }

  // Stream paginated data
  static async streamPaginated(res, fetcher, options = {}) {
    const {
      pageSize = 50,
      maxPages = 100,
      delayMs = 10, // Small delay between pages to prevent memory buildup
      transformItem = item => item
    } = options;

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'X-Stream': 'paginated',
      'X-Page-Size': pageSize,
      'Cache-Control': 'no-cache'
    });

    res.write('{"success":true,"data":[');

    let first = true;
    let totalCount = 0;
    let pageCount = 0;
    let hasMore = true;

    try {
      while (hasMore && pageCount < maxPages) {
        const offset = pageCount * pageSize;
        const pageData = await fetcher(pageSize, offset);
        
        if (!pageData || pageData.length === 0) {
          hasMore = false;
          break;
        }

        for (const item of pageData) {
          if (!first) res.write(',');
          res.write(JSON.stringify(transformItem(item)));
          first = false;
          totalCount++;
        }

        pageCount++;
        hasMore = pageData.length === pageSize;

        // Small delay to prevent memory buildup
        if (hasMore && delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        // Force garbage collection hint
        if (pageCount % 5 === 0 && global.gc) {
          setImmediate(() => global.gc());
        }

        console.log(`📄 Streamed page ${pageCount}: ${pageData.length} items (total: ${totalCount})`);
      }

      res.write(`],"metadata":{"totalCount":${totalCount},"pageCount":${pageCount},"pageSize":${pageSize},"hasMore":${hasMore},"streamed":true}}`);
      res.end();

      console.log(`✅ Streaming completed: ${totalCount} total items in ${pageCount} pages`);
    } catch (error) {
      console.error('❌ Paginated streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      } else {
        res.write(`],"error":"${error.message}","metadata":{"totalCount":${totalCount},"pageCount":${pageCount},"hasMore":false}}`);
        res.end();
      }
    }
  }

  // Transform stream for processing large data
  static createTransformStream(transform) {
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        try {
          const result = transform(chunk);
          callback(null, result);
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  // Memory-efficient data processor
  static async processLargeDataset(data, processor, batchSize = 100) {
    const results = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const processedBatch = await Promise.all(batch.map(processor));
      results.push(...processedBatch);
      
      // Yield control and trigger GC hint
      if (i % (batchSize * 5) === 0) {
        await new Promise(resolve => setImmediate(resolve));
        if (global.gc) global.gc();
      }
    }
    
    return results;
  }

  // Create async generator from array with memory management
  static async* createAsyncGenerator(data, batchSize = 50) {
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      for (const item of batch) {
        yield item;
      }
      
      // Memory management between batches
      if (i % (batchSize * 10) === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
  }

  // Check if request accepts streaming
  static supportsStreaming(req) {
    const acceptsStream = req.headers['accept']?.includes('application/stream+json') ||
                         req.query.stream === 'true';
    return acceptsStream;
  }

  // Streaming error handler
  static handleStreamError(res, error, context = {}) {
    console.error(`❌ Streaming error in ${context.endpoint || 'unknown'}:`, error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Streaming failed',
        message: error.message,
        context
      });
    } else {
      try {
        res.write(`],"error":"Streaming interrupted: ${error.message}","context":${JSON.stringify(context)}}`);
        res.end();
      } catch (writeError) {
        console.error('❌ Failed to write error to stream:', writeError);
      }
    }
  }
}

export default StreamingResponseService;
