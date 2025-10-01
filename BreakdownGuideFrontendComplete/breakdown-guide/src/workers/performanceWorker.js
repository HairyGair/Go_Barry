// Performance monitoring and analytics web worker
// Runs in background to avoid blocking main thread

class PerformanceWorker {
  constructor() {
    this.metrics = new Map()
    this.perfEntries = []
    this.isRecording = false
    
    this.startRecording()
  }

  startRecording() {
    this.isRecording = true
    
    // Setup performance observer if available
    if ('PerformanceObserver' in self) {
      try {
        // Observe navigation timing
        const navObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.perfEntries.push({
              type: 'navigation',
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration,
              timestamp: Date.now()
            })
          })
        })
        navObserver.observe({ entryTypes: ['navigation'] })

        // Observe resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            // Only track significant resources
            if (entry.duration > 10 || entry.transferSize > 10000) {
              this.perfEntries.push({
                type: 'resource',
                name: entry.name,
                startTime: entry.startTime,
                duration: entry.duration,
                transferSize: entry.transferSize,
                timestamp: Date.now()
              })
            }
          })
        })
        resourceObserver.observe({ entryTypes: ['resource'] })

        // Observe paint timing
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.perfEntries.push({
              type: 'paint',
              name: entry.name,
              startTime: entry.startTime,
              timestamp: Date.now()
            })
          })
        })
        paintObserver.observe({ entryTypes: ['paint'] })

      } catch (error) {
        console.warn('Performance Observer not fully supported:', error)
      }
    }
  }

  stopRecording() {
    this.isRecording = false
  }

  // Analyze wizard performance
  analyzeWizardPerformance(wizardData) {
    const { wizardType, startTime, endTime, stepCount, responseCount } = wizardData
    
    const duration = endTime - startTime
    const avgTimePerStep = duration / stepCount
    const avgTimePerResponse = duration / responseCount
    
    const analysis = {
      wizardType,
      totalDuration: duration,
      stepCount,
      responseCount,
      avgTimePerStep,
      avgTimePerResponse,
      efficiency: this.calculateEfficiency(duration, stepCount),
      timestamp: Date.now()
    }
    
    this.metrics.set(`wizard_${wizardType}_${Date.now()}`, analysis)
    
    return analysis
  }

  // Calculate efficiency score (lower is better)
  calculateEfficiency(duration, stepCount) {
    const baselineTimePerStep = 30000 // 30 seconds baseline
    const expectedDuration = stepCount * baselineTimePerStep
    return Math.round((duration / expectedDuration) * 100)
  }

  // Analyze bundle performance
  analyzeBundlePerformance() {
    const resourceEntries = this.perfEntries.filter(entry => 
      entry.type === 'resource' && 
      (entry.name.includes('.js') || entry.name.includes('.css'))
    )

    const totalSize = resourceEntries.reduce((sum, entry) => 
      sum + (entry.transferSize || 0), 0
    )
    
    const totalLoadTime = resourceEntries.reduce((sum, entry) => 
      sum + entry.duration, 0
    )

    const heaviestResources = resourceEntries
      .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
      .slice(0, 5)

    const slowestResources = resourceEntries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)

    return {
      totalResources: resourceEntries.length,
      totalSize,
      totalLoadTime,
      averageLoadTime: totalLoadTime / resourceEntries.length,
      heaviestResources: heaviestResources.map(r => ({
        name: r.name.split('/').pop(),
        size: r.transferSize,
        duration: r.duration
      })),
      slowestResources: slowestResources.map(r => ({
        name: r.name.split('/').pop(),
        duration: r.duration,
        size: r.transferSize
      }))
    }
  }

  // Get performance recommendations
  getPerformanceRecommendations() {
    const bundleAnalysis = this.analyzeBundlePerformance()
    const recommendations = []

    // Check bundle size
    if (bundleAnalysis.totalSize > 1024 * 1024) { // 1MB
      recommendations.push({
        priority: 'high',
        type: 'bundle_size',
        message: 'Total bundle size exceeds 1MB. Consider code splitting.',
        metric: bundleAnalysis.totalSize
      })
    }

    // Check slow resources
    bundleAnalysis.slowestResources.forEach(resource => {
      if (resource.duration > 2000) { // 2 seconds
        recommendations.push({
          priority: 'medium',
          type: 'slow_resource',
          message: `Resource ${resource.name} takes ${Math.round(resource.duration)}ms to load`,
          resource: resource.name
        })
      }
    })

    // Check paint timing
    const paintEntries = this.perfEntries.filter(entry => entry.type === 'paint')
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    
    if (fcp && fcp.startTime > 3000) { // 3 seconds
      recommendations.push({
        priority: 'high',
        type: 'slow_fcp',
        message: 'First Contentful Paint is slow. Consider optimizing critical resources.',
        metric: fcp.startTime
      })
    }

    return recommendations
  }

  // Process analytics data in chunks to avoid blocking
  processAnalyticsData(data, chunkSize = 100) {
    return new Promise((resolve) => {
      const results = []
      let index = 0

      const processChunk = () => {
        const chunk = data.slice(index, index + chunkSize)
        
        chunk.forEach(item => {
          // Process each analytics item
          if (item.type === 'wizard_performance') {
            results.push(this.analyzeWizardPerformance(item.data))
          } else if (item.type === 'user_interaction') {
            results.push(this.analyzeUserInteraction(item.data))
          }
        })

        index += chunkSize

        if (index < data.length) {
          // Process next chunk in next tick
          setTimeout(processChunk, 0)
        } else {
          resolve(results)
        }
      }

      processChunk()
    })
  }

  // Get current performance summary
  getPerformanceSummary() {
    return {
      metricsCount: this.metrics.size,
      perfEntriesCount: this.perfEntries.length,
      isRecording: this.isRecording,
      bundleAnalysis: this.analyzeBundlePerformance(),
      recommendations: this.getPerformanceRecommendations(),
      timestamp: Date.now()
    }
  }

  // Clear old data to prevent memory leaks
  cleanup(maxAge = 3600000) { // 1 hour default
    const cutoff = Date.now() - maxAge
    
    // Clean metrics
    for (const [key, value] of this.metrics.entries()) {
      if (value.timestamp < cutoff) {
        this.metrics.delete(key)
      }
    }

    // Clean performance entries
    this.perfEntries = this.perfEntries.filter(entry => 
      entry.timestamp > cutoff
    )
  }
}

// Initialize worker
const worker = new PerformanceWorker()

// Handle messages from main thread
self.addEventListener('message', function(e) {
  const { type, data, id } = e.data

  try {
    let result

    switch (type) {
      case 'analyze_wizard':
        result = worker.analyzeWizardPerformance(data)
        break
      
      case 'analyze_bundle':
        result = worker.analyzeBundlePerformance()
        break
      
      case 'get_recommendations':
        result = worker.getPerformanceRecommendations()
        break
      
      case 'get_summary':
        result = worker.getPerformanceSummary()
        break
      
      case 'process_analytics':
        worker.processAnalyticsData(data.items, data.chunkSize)
          .then(results => {
            self.postMessage({ type: 'analytics_processed', data: results, id })
          })
        return
      
      case 'cleanup':
        worker.cleanup(data.maxAge)
        result = { cleaned: true }
        break
      
      case 'stop_recording':
        worker.stopRecording()
        result = { stopped: true }
        break
      
      case 'start_recording':
        worker.startRecording()
        result = { started: true }
        break
      
      default:
        throw new Error(`Unknown message type: ${type}`)
    }

    self.postMessage({ type: 'result', data: result, id })
    
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error.message, 
      id 
    })
  }
})

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  worker.cleanup()
}, 300000) // Every 5 minutes

console.log('🔧 Performance Worker initialized')