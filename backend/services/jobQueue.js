// Lightweight Background Job Queue
// Memory-efficient alternative to Bull/Redis for simple job processing

import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class LightweightJobQueue extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.jobs = [];
    this.processing = false;
    this.workers = options.workers || 1;
    this.activeWorkers = 0;
    this.persistPath = path.join(__dirname, '../../data/queues', `${name}.json`);
    this.stats = {
      processed: 0,
      failed: 0,
      total: 0
    };
    this.handlers = new Map();
    this.cronJobs = new Map();
  }

  async initialize() {
    // Ensure queue directory exists
    await fs.mkdir(path.dirname(this.persistPath), { recursive: true });
    
    // Load persisted jobs
    await this.loadJobs();
    
    // Start processing
    this.startProcessing();
  }

  // Add a job to the queue
  async add(type, data, options = {}) {
    const job = {
      id: `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      priority: options.priority || 0,
      createdAt: new Date().toISOString(),
      nextAttempt: options.delay 
        ? new Date(Date.now() + options.delay).toISOString()
        : new Date().toISOString(),
      status: 'pending'
    };

    this.jobs.push(job);
    this.stats.total++;
    
    // Sort by priority and next attempt time
    this.jobs.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(a.nextAttempt) - new Date(b.nextAttempt);
    });

    // Persist to disk
    await this.saveJobs();
    
    // Emit event
    this.emit('job:added', job);
    
    // Trigger processing if not already running
    this.processNext();
    
    return job;
  }

  // Register a job handler
  process(type, handler) {
    this.handlers.set(type, handler);
  }

  // Start processing loop
  startProcessing() {
    setInterval(() => {
      this.processNext();
    }, 1000); // Check every second
  }

  // Process next available job
  async processNext() {
    if (this.activeWorkers >= this.workers) {
      return; // All workers busy
    }

    const now = new Date();
    const job = this.jobs.find(j => 
      j.status === 'pending' && 
      new Date(j.nextAttempt) <= now
    );

    if (!job) {
      return; // No jobs ready
    }

    // Mark job as processing
    job.status = 'processing';
    this.activeWorkers++;

    try {
      const handler = this.handlers.get(job.type);
      if (!handler) {
        throw new Error(`No handler for job type: ${job.type}`);
      }

      // Execute job
      await handler(job);
      
      // Mark as completed
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      this.stats.processed++;
      
      // Remove from queue
      this.jobs = this.jobs.filter(j => j.id !== job.id);
      
      this.emit('job:completed', job);
    } catch (error) {
      job.attempts++;
      job.lastError = error.message;
      
      if (job.attempts >= job.maxAttempts) {
        // Job failed permanently
        job.status = 'failed';
        job.failedAt = new Date().toISOString();
        this.stats.failed++;
        
        // Move to dead letter queue
        await this.moveToDeadLetter(job);
        
        // Remove from main queue
        this.jobs = this.jobs.filter(j => j.id !== job.id);
        
        this.emit('job:failed', job);
      } else {
        // Retry with exponential backoff
        job.status = 'pending';
        job.nextAttempt = new Date(
          Date.now() + Math.pow(2, job.attempts) * 1000
        ).toISOString();
        
        this.emit('job:retry', job);
      }
    } finally {
      this.activeWorkers--;
      await this.saveJobs();
      
      // Process next job
      if (this.jobs.length > 0) {
        this.processNext();
      }
    }
  }

  // Schedule a recurring job
  schedule(cronPattern, type, data) {
    const jobId = `cron-${type}-${Date.now()}`;
    
    // Parse cron pattern (simplified)
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronPattern.split(' ');
    
    const cronJob = {
      id: jobId,
      pattern: cronPattern,
      type,
      data,
      nextRun: this.calculateNextRun(cronPattern),
      active: true
    };
    
    this.cronJobs.set(jobId, cronJob);
    
    // Check cron jobs every minute
    if (!this.cronInterval) {
      this.cronInterval = setInterval(() => {
        this.checkCronJobs();
      }, 60000);
    }
    
    return jobId;
  }

  // Check and execute cron jobs
  async checkCronJobs() {
    const now = new Date();
    
    for (const [id, cronJob] of this.cronJobs) {
      if (!cronJob.active) continue;
      
      if (new Date(cronJob.nextRun) <= now) {
        // Add job to queue
        await this.add(cronJob.type, cronJob.data);
        
        // Calculate next run
        cronJob.nextRun = this.calculateNextRun(cronJob.pattern);
        cronJob.lastRun = now.toISOString();
      }
    }
  }

  // Calculate next run time for cron pattern
  calculateNextRun(pattern) {
    // Simplified cron calculation
    const [minute, hour, dayOfMonth, month, dayOfWeek] = pattern.split(' ');
    const now = new Date();
    const next = new Date(now);
    
    if (hour === '*' && minute === '*') {
      // Every minute
      next.setMinutes(next.getMinutes() + 1);
    } else if (hour === '*') {
      // Every hour at specific minute
      next.setMinutes(parseInt(minute));
      if (next <= now) {
        next.setHours(next.getHours() + 1);
      }
    } else {
      // Daily at specific time
      next.setHours(parseInt(hour));
      next.setMinutes(parseInt(minute));
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
    }
    
    return next.toISOString();
  }

  // Move failed job to dead letter queue
  async moveToDeadLetter(job) {
    const deadLetterPath = path.join(
      __dirname, 
      '../../data/queues', 
      `${this.name}-dead.json`
    );
    
    try {
      let deadJobs = [];
      try {
        const content = await fs.readFile(deadLetterPath, 'utf-8');
        deadJobs = JSON.parse(content);
      } catch (e) {
        // File doesn't exist yet
      }
      
      deadJobs.push(job);
      
      // Keep only last 100 dead jobs
      if (deadJobs.length > 100) {
        deadJobs = deadJobs.slice(-100);
      }
      
      await fs.writeFile(deadLetterPath, JSON.stringify(deadJobs, null, 2));
    } catch (error) {
      console.error('Failed to save to dead letter queue:', error);
    }
  }

  // Persist jobs to disk
  async saveJobs() {
    try {
      await fs.writeFile(
        this.persistPath, 
        JSON.stringify(this.jobs, null, 2)
      );
    } catch (error) {
      console.error('Failed to persist jobs:', error);
    }
  }

  // Load jobs from disk
  async loadJobs() {
    try {
      const content = await fs.readFile(this.persistPath, 'utf-8');
      this.jobs = JSON.parse(content);
      
      // Reset processing status for interrupted jobs
      this.jobs.forEach(job => {
        if (job.status === 'processing') {
          job.status = 'pending';
        }
      });
    } catch (error) {
      // No persisted jobs
      this.jobs = [];
    }
  }

  // Get queue statistics
  getStats() {
    const pending = this.jobs.filter(j => j.status === 'pending').length;
    const processing = this.jobs.filter(j => j.status === 'processing').length;
    
    return {
      name: this.name,
      pending,
      processing,
      activeWorkers: this.activeWorkers,
      maxWorkers: this.workers,
      ...this.stats,
      cronJobs: this.cronJobs.size
    };
  }

  // Clear all jobs
  async clear() {
    this.jobs = [];
    await this.saveJobs();
    this.emit('queue:cleared');
  }

  // Retry failed jobs from dead letter queue
  async retryDeadLetterJobs() {
    const deadLetterPath = path.join(
      __dirname, 
      '../../data/queues', 
      `${this.name}-dead.json`
    );
    
    try {
      const content = await fs.readFile(deadLetterPath, 'utf-8');
      const deadJobs = JSON.parse(content);
      
      for (const job of deadJobs) {
        await this.add(job.type, job.data);
      }
      
      // Clear dead letter queue
      await fs.writeFile(deadLetterPath, '[]');
      
      return deadJobs.length;
    } catch (error) {
      return 0;
    }
  }
}

// Create default queues
const queues = new Map();

export function createQueue(name, options) {
  if (queues.has(name)) {
    return queues.get(name);
  }
  
  const queue = new LightweightJobQueue(name, options);
  queue.initialize();
  queues.set(name, queue);
  
  return queue;
}

// Default queues
export const cleanupQueue = createQueue('cleanup', { workers: 1 });
export const emailQueue = createQueue('email', { workers: 2 });
export const notificationQueue = createQueue('notifications', { workers: 3 });

// Register default handlers
cleanupQueue.process('cleanup:dismissed-alerts', async (job) => {
  console.log('Cleaning up dismissed alerts...', job.data);
  // Cleanup logic here
});

// Schedule daily cleanup
cleanupQueue.schedule('0 2 * * *', 'cleanup:dismissed-alerts', {
  type: 'daily'
});

export default { createQueue, cleanupQueue, emailQueue, notificationQueue };
