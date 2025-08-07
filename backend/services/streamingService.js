// Enhanced Streaming Response Service
// Efficiently handles large datasets without memory overload

import { Transform } from 'stream';
import JSONStream from 'JSONStream';

class StreamingService {
  
  // JSON Array Streamer
  createJSONArrayStream() {
    let first = true;
    
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        if (first) {
          this.push('[');
          first = false;
        } else {
          this.push(',');
        }
        this.push(JSON.stringify(chunk));
        callback();
      },
      flush(callback) {
        if (first) {
          this.push('[');
        }
        this.push(']');
        callback();
      }
    });
  }

  // NDJSON Streamer (newline-delimited JSON)
  createNDJSONStream() {
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        this.push(JSON.stringify(chunk) + '\n');
        callback();
      }
    });
  }

  // CSV Streamer
  createCSVStream(headers) {
    let headersSent = false;
    
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        if (!headersSent && headers) {
          this.push(headers.join(',') + '\n');
          headersSent = true;
        }
        
        const values = headers 
          ? headers.map(h => chunk[h] || '')
          : Object.values(chunk);
          
        const escaped = values.map(v => {
          const str = String(v);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"` 
            : str;
        });
        
        this.push(escaped.join(',') + '\n');
        callback();
      }
    });
  }

  // Express middleware for streaming responses
  streamingMiddleware() {
    return (req, res, next) => {
      // Add streaming helper to response
      res.stream = {
        json: (dataStream, options = {}) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Transfer-Encoding', 'chunked');
          
          if (options.download) {
            res.setHeader('Content-Disposition', 
              `attachment; filename="${options.filename || 'data.json'}"`);
          }
          
          const jsonStream = this.createJSONArrayStream();
          dataStream.pipe(jsonStream).pipe(res);
        },
        
        ndjson: (dataStream, options = {}) => {
          res.setHeader('Content-Type', 'application/x-ndjson');
          res.setHeader('Transfer-Encoding', 'chunked');
          
          const ndjsonStream = this.createNDJSONStream();
          dataStream.pipe(ndjsonStream).pipe(res);
        },
        
        csv: (dataStream, headers, options = {}) => {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Transfer-Encoding', 'chunked');
          
          if (options.download) {
            res.setHeader('Content-Disposition', 
              `attachment; filename="${options.filename || 'data.csv'}"`);
          }
          
          const csvStream = this.createCSVStream(headers);
          dataStream.pipe(csvStream).pipe(res);
        }
      };
      
      next();
    };
  }

  // Stream from database with pagination
  async *databaseStream(query, pageSize = 100) {
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const results = await query.limit(pageSize).offset(offset);
      
      if (results.length === 0) {
        hasMore = false;
      } else {
        for (const item of results) {
          yield item;
        }
        offset += pageSize;
      }
    }
  }

  // Stream processor with backpressure handling
  createProcessorStream(processFn) {
    return new Transform({
      objectMode: true,
      highWaterMark: 16, // Control buffering
      async transform(chunk, encoding, callback) {
        try {
          const processed = await processFn(chunk);
          callback(null, processed);
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  // Batch processor stream
  createBatchStream(batchSize = 10, processFn) {
    let batch = [];
    
    return new Transform({
      objectMode: true,
      async transform(chunk, encoding, callback) {
        batch.push(chunk);
        
        if (batch.length >= batchSize) {
          try {
            const processed = await processFn(batch);
            batch = [];
            for (const item of processed) {
              this.push(item);
            }
          } catch (error) {
            return callback(error);
          }
        }
        callback();
      },
      async flush(callback) {
        if (batch.length > 0) {
          try {
            const processed = await processFn(batch);
            for (const item of processed) {
              this.push(item);
            }
          } catch (error) {
            return callback(error);
          }
        }
        callback();
      }
    });
  }

  // Progress tracking stream
  createProgressStream(totalItems, onProgress) {
    let processed = 0;
    
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        processed++;
        
        if (onProgress) {
          const progress = totalItems 
            ? (processed / totalItems * 100).toFixed(2)
            : processed;
          onProgress(progress, processed);
        }
        
        callback(null, chunk);
      }
    });
  }
}

// Singleton instance
const streamingService = new StreamingService();
export default streamingService;

// Example usage in routes:
/*
router.get('/export/roadworks', async (req, res) => {
  const { format = 'json' } = req.query;
  
  // Create a readable stream from database
  const dataStream = Readable.from(
    streamingService.databaseStream(
      supabase.from('roadworks').select('*'),
      100
    )
  );
  
  // Add processing
  const processStream = dataStream
    .pipe(streamingService.createProcessorStream(async (item) => {
      // Enhance each item
      return { ...item, processed: true };
    }));
  
  // Stream response based on format
  switch (format) {
    case 'csv':
      const headers = ['id', 'location', 'description', 'startDate'];
      res.stream.csv(processStream, headers, { 
        download: true, 
        filename: 'roadworks.csv' 
      });
      break;
    case 'ndjson':
      res.stream.ndjson(processStream);
      break;
    default:
      res.stream.json(processStream);
  }
});
*/
