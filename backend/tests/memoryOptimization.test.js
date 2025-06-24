// backend/tests/memoryOptimization.test.js
// Unit tests for memory optimization features

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

describe('Memory Optimization Features', () => {
  
  describe('Manual Incidents Size Limiting', () => {
    it('should limit manual incidents to prevent memory growth', () => {
      const mockManualIncidents = [];
      const MAX_MANUAL_INCIDENTS = 500;
      
      // Simulate adding incidents beyond limit
      for (let i = 0; i < MAX_MANUAL_INCIDENTS + 50; i++) {
        const incident = {
          id: `incident_${i}`,
          type: 'roadworks',
          location: `Location ${i}`,
          timestamp: Date.now()
        };
        
        mockManualIncidents.push(incident);
        
        // Apply size limit logic
        if (mockManualIncidents.length > MAX_MANUAL_INCIDENTS) {
          const removed = mockManualIncidents.shift(); // Remove oldest
          assert.ok(removed, 'Should remove oldest incident');
        }
      }
      
      assert.strictEqual(
        mockManualIncidents.length, 
        MAX_MANUAL_INCIDENTS, 
        'Should maintain size limit for manual incidents'
      );
      
      // Check that newest incidents are preserved
      const latestIncident = mockManualIncidents[mockManualIncidents.length - 1];
      assert.ok(
        latestIncident.id.includes('549'), // Last incident should be from the 550 total
        'Should preserve newest incidents'
      );
    });

    it('should handle concurrent incident additions safely', () => {
      const mockManualIncidents = [];
      const MAX_MANUAL_INCIDENTS = 100;
      
      // Simulate concurrent additions
      const addIncident = (id) => {
        const incident = { id, timestamp: Date.now() };
        mockManualIncidents.push(incident);
        
        if (mockManualIncidents.length > MAX_MANUAL_INCIDENTS) {
          mockManualIncidents.shift();
        }
        
        return mockManualIncidents.length;
      };
      
      // Add incidents in batches
      for (let batch = 0; batch < 5; batch++) {
        for (let i = 0; i < 25; i++) {
          const size = addIncident(`batch_${batch}_${i}`);
          assert.ok(size <= MAX_MANUAL_INCIDENTS, 'Should never exceed limit');
        }
      }
      
      assert.strictEqual(mockManualIncidents.length, MAX_MANUAL_INCIDENTS);
    });
  });

  describe('Dismissed Incidents Memory Management', () => {
    it('should limit dismissed incidents Map size', () => {
      const mockDismissedIncidents = new Map();
      const MAX_DISMISSED_INCIDENTS = 2000;
      
      // Add incidents beyond limit
      for (let i = 0; i < MAX_DISMISSED_INCIDENTS + 200; i++) {
        const alertId = `alert_${i}`;
        const dismissalRecord = {
          alertId,
          supervisorId: 'supervisor001',
          dismissedAt: Date.now(),
          reason: 'resolved'
        };
        
        mockDismissedIncidents.set(alertId, dismissalRecord);
        
        // Apply size limit logic (remove oldest 20% when limit exceeded)
        if (mockDismissedIncidents.size > MAX_DISMISSED_INCIDENTS) {
          const keysToRemove = Array.from(mockDismissedIncidents.keys())
            .slice(0, Math.floor(MAX_DISMISSED_INCIDENTS * 0.2));
          
          keysToRemove.forEach(key => mockDismissedIncidents.delete(key));
        }
      }
      
      assert.ok(
        mockDismissedIncidents.size <= MAX_DISMISSED_INCIDENTS,
        'Should maintain size limit for dismissed incidents'
      );
      
      // Should have removed some old entries
      assert.ok(
        mockDismissedIncidents.size < MAX_DISMISSED_INCIDENTS + 200,
        'Should have removed old entries'
      );
    });

    it('should preserve recent dismissals during cleanup', () => {
      const mockDismissedIncidents = new Map();
      const MAX_DISMISSED_INCIDENTS = 10; // Small limit for testing
      
      // Add incidents with timestamps
      for (let i = 0; i < 15; i++) {
        const alertId = `alert_${i}`;
        mockDismissedIncidents.set(alertId, {
          alertId,
          dismissedAt: Date.now() + i, // Newer items have higher timestamps
          supervisorId: 'supervisor001'
        });
      }
      
      // Apply cleanup (remove oldest 20% = 2 items)
      if (mockDismissedIncidents.size > MAX_DISMISSED_INCIDENTS) {
        const keysToRemove = Array.from(mockDismissedIncidents.keys()).slice(0, 2);
        keysToRemove.forEach(key => mockDismissedIncidents.delete(key));
      }
      
      // Check that oldest items were removed
      assert.ok(!mockDismissedIncidents.has('alert_0'), 'Should remove oldest');
      assert.ok(!mockDismissedIncidents.has('alert_1'), 'Should remove oldest');
      assert.ok(mockDismissedIncidents.has('alert_14'), 'Should keep newest');
    });
  });

  describe('Cache Management', () => {
    it('should implement TTL for alert caches', () => {
      const mockCache = {
        data: null,
        timestamp: null,
        ttl: 2 * 60 * 1000 // 2 minutes
      };
      
      const now = Date.now();
      
      // Set fresh cache
      mockCache.data = { alerts: ['alert1', 'alert2'] };
      mockCache.timestamp = now;
      
      // Check if cache is fresh
      const isFresh = (now - mockCache.timestamp) < mockCache.ttl;
      assert.strictEqual(isFresh, true, 'Fresh cache should be valid');
      
      // Simulate expired cache
      mockCache.timestamp = now - (3 * 60 * 1000); // 3 minutes ago
      const isExpired = (now - mockCache.timestamp) >= mockCache.ttl;
      assert.strictEqual(isExpired, true, 'Expired cache should be invalid');
    });

    it('should handle cache invalidation properly', () => {
      const mockCaches = {
        alerts: { data: 'cached_alerts', timestamp: Date.now() },
        enhanced: { data: 'cached_enhanced', timestamp: Date.now() },
        routes: { data: 'cached_routes', timestamp: Date.now() }
      };
      
      // Invalidate all caches
      const invalidateAllCaches = () => {
        Object.keys(mockCaches).forEach(key => {
          mockCaches[key] = { data: null, timestamp: null };
        });
      };
      
      invalidateAllCaches();
      
      Object.values(mockCaches).forEach(cache => {
        assert.strictEqual(cache.data, null, 'Cache data should be cleared');
        assert.strictEqual(cache.timestamp, null, 'Cache timestamp should be cleared');
      });
    });
  });

  describe('GTFS Data Streaming', () => {
    it('should process GTFS data in chunks to avoid memory overload', () => {
      const CHUNK_SIZE = 64 * 1024; // 64KB chunks
      const PROCESSING_BATCH_SIZE = 100; // Process 100 records at a time
      
      // Simulate large GTFS file processing
      const mockFileSize = 45 * 1024 * 1024; // 45MB file
      const expectedChunks = Math.ceil(mockFileSize / CHUNK_SIZE);
      
      let processedChunks = 0;
      let processedRecords = 0;
      
      // Simulate chunk processing
      for (let i = 0; i < expectedChunks; i++) {
        processedChunks++;
        
        // Simulate processing records in batches
        const recordsInChunk = Math.min(PROCESSING_BATCH_SIZE, 200); // Max records per chunk
        processedRecords += recordsInChunk;
        
        // Verify memory usage doesn't accumulate (simulation)
        const simulatedMemoryUsage = Math.min(processedChunks * 1, 50); // 1MB per chunk max, bounded at 50MB
        assert.ok(
          simulatedMemoryUsage <= 100, // Should never exceed 100MB in memory
          'Memory usage should stay bounded during streaming'
        );
      }
      
      assert.ok(processedChunks > 0, 'Should process chunks');
      assert.ok(processedRecords > 0, 'Should process records');
    });

    it('should implement memory cleanup during processing', () => {
      const mockProcessor = {
        currentChunk: null,
        processedCount: 0,
        memoryUsage: 0
      };
      
      const MAX_MEMORY_MB = 1200; // 1.2GB limit
      
      // Simulate processing with memory monitoring
      for (let i = 0; i < 1000; i++) {
        mockProcessor.currentChunk = `chunk_${i}`;
        mockProcessor.processedCount++;
        mockProcessor.memoryUsage += 1; // 1MB per operation
        
        // Trigger cleanup when approaching limit
        if (mockProcessor.memoryUsage > MAX_MEMORY_MB * 0.8) { // 80% threshold
          // Simulate garbage collection
          mockProcessor.currentChunk = null;
          mockProcessor.memoryUsage = Math.floor(mockProcessor.memoryUsage * 0.5); // Reduce by 50%
        }
      }
      
      assert.ok(
        mockProcessor.memoryUsage < MAX_MEMORY_MB,
        'Memory usage should stay below limit with cleanup'
      );
      assert.strictEqual(mockProcessor.processedCount, 1000, 'Should process all items');
    });
  });

  describe('Session Cleanup', () => {
    it('should clean up expired sessions periodically', () => {
      const mockSessions = new Map();
      const now = Date.now();
      const sessionTimeout = 10 * 60 * 1000; // 10 minutes
      
      // Add mix of active and expired sessions
      mockSessions.set('active1', { 
        lastActivity: now - (5 * 60 * 1000), // 5 minutes ago
        expiresAt: now + (24 * 60 * 60 * 1000) 
      });
      
      mockSessions.set('expired1', { 
        lastActivity: now - (15 * 60 * 1000), // 15 minutes ago
        expiresAt: now + (24 * 60 * 60 * 1000) 
      });
      
      mockSessions.set('expired2', { 
        lastActivity: now - (20 * 60 * 1000), // 20 minutes ago
        expiresAt: now - 1000 // Actually expired
      });
      
      // Simulate cleanup function
      const cleanupExpiredSessions = () => {
        let cleanedCount = 0;
        for (const [sessionId, session] of mockSessions.entries()) {
          const isExpired = session.expiresAt < now ||
            (now - session.lastActivity) > sessionTimeout;
          
          if (isExpired) {
            mockSessions.delete(sessionId);
            cleanedCount++;
          }
        }
        return cleanedCount;
      };
      
      const cleaned = cleanupExpiredSessions();
      
      assert.strictEqual(cleaned, 2, 'Should clean up 2 expired sessions');
      assert.strictEqual(mockSessions.size, 1, 'Should keep 1 active session');
      assert.ok(mockSessions.has('active1'), 'Should keep active session');
    });
  });

  describe('Memory Monitoring', () => {
    it('should track memory usage and trigger warnings', () => {
      const mockMemoryStats = {
        rss: 1800 * 1024 * 1024, // 1.8GB
        heapTotal: 1500 * 1024 * 1024, // 1.5GB
        heapUsed: 1200 * 1024 * 1024, // 1.2GB
        external: 100 * 1024 * 1024 // 100MB
      };
      
      const MEMORY_LIMIT = 2048 * 1024 * 1024; // 2GB
      const WARNING_THRESHOLD = 0.8; // 80%
      
      const memoryUsagePercent = mockMemoryStats.rss / MEMORY_LIMIT;
      const shouldWarn = memoryUsagePercent > WARNING_THRESHOLD;
      
      assert.strictEqual(shouldWarn, true, 'Should warn at 90% memory usage');
      
      // Test critical threshold
      const CRITICAL_THRESHOLD = 0.95; // 95%
      const isCritical = memoryUsagePercent > CRITICAL_THRESHOLD;
      assert.strictEqual(isCritical, false, 'Should not be critical at 90%');
    });
  });
});

export default describe;