// Performance monitoring service with web worker integration
class PerformanceService {
  constructor() {
    this.worker = null
    this.isSupported = 'Worker' in window && 'PerformanceObserver' in window
    this.metrics = new Map()
    this.callbacks = new Map()
    this.messageId = 0
    
    this.init()
  }

  async init() {
    if (!this.isSupported) {
      console.warn('⚠️ Performance monitoring not fully supported in this browser')
      return
    }

    try {
      // Initialize web worker
      this.worker = new Worker(
        new URL('../workers/performanceWorker.js', import.meta.url),
        { type: 'module' }
      )
      
      this.worker.addEventListener('message', this.handleWorkerMessage.bind(this))
      this.worker.addEventListener('error', this.handleWorkerError.bind(this))
      
      console.log('✅ Performance monitoring service initialized')
    } catch (error) {
      console.error('❌ Failed to initialize performance worker:', error)
      this.isSupported = false
    }
  }

  handleWorkerMessage(event) {
    const { type, data, error, id } = event.data
    
    if (type === 'error') {
      console.error('Performance worker error:', error)
      return
    }

    // Handle callback if ID provided
    if (id && this.callbacks.has(id)) {
      const callback = this.callbacks.get(id)
      this.callbacks.delete(id)
      callback(data)
    }

    // Handle continuous data streams
    if (type === 'analytics_processed') {
      this.handleAnalyticsProcessed(data)
    }
  }

  handleWorkerError(error) {
    console.error('Performance worker error:', error)
  }

  // Send message to worker with callback support
  sendWorkerMessage(type, data = null) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Performance worker not available'))
        return
      }

      const id = this.messageId++
      this.callbacks.set(id, resolve)
      
      this.worker.postMessage({ type, data, id })
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id)
          reject(new Error('Performance worker timeout'))
        }
      }, 10000)
    })
  }

  // Track wizard performance
  async trackWizardStart(wizardType, vehicleData) {
    const startTime = performance.now()
    
    this.metrics.set(`wizard_${wizardType}_start`, {
      wizardType,
      startTime,
      vehicleData,
      timestamp: Date.now()
    })

    // Track critical user timing
    if ('performance' in window && 'mark' in window.performance) {
      performance.mark(`wizard-${wizardType}-start`)
    }

    console.log(`📊 Started tracking wizard: ${wizardType}`)
  }

  async trackWizardComplete(wizardType, assessmentData) {
    const endTime = performance.now()
    const startData = this.metrics.get(`wizard_${wizardType}_start`)
    
    if (!startData) {
      console.warn(`No start data found for wizard: ${wizardType}`)
      return
    }

    // Mark completion
    if ('performance' in window && 'mark' in window.performance) {
      performance.mark(`wizard-${wizardType}-end`)
      performance.measure(
        `wizard-${wizardType}-duration`,
        `wizard-${wizardType}-start`,
        `wizard-${wizardType}-end`
      )
    }

    const wizardData = {
      wizardType,
      startTime: startData.startTime,
      endTime,
      stepCount: assessmentData.totalSteps || 1,
      responseCount: Object.keys(assessmentData.responses || {}).length,
      decision: assessmentData.decision,
      vehicleData: startData.vehicleData
    }

    try {
      const analysis = await this.sendWorkerMessage('analyze_wizard', wizardData)
      
      // Log to analytics
      if (window.BreakdownAnalytics) {
        window.BreakdownAnalytics.logPerformance('WIZARD_COMPLETION', {
          ...analysis,
          rawData: wizardData
        })
      }

      console.log(`📊 Wizard performance analysis:`, analysis)
      return analysis
    } catch (error) {
      console.error('Failed to analyze wizard performance:', error)
    }
  }

  // Track page load performance
  async trackPageLoad() {
    // Wait for page to fully load
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve, { once: true })
      })
    }

    try {
      const summary = await this.sendWorkerMessage('get_summary')
      
      // Log to analytics
      if (window.BreakdownAnalytics) {
        window.BreakdownAnalytics.logPerformance('PAGE_LOAD', summary)
      }

      return summary
    } catch (error) {
      console.error('Failed to get performance summary:', error)
    }
  }

  // Get performance recommendations
  async getRecommendations() {
    try {
      return await this.sendWorkerMessage('get_recommendations')
    } catch (error) {
      console.error('Failed to get performance recommendations:', error)
      return []
    }
  }

  // Track user interactions
  trackUserInteraction(interactionType, data = {}) {
    const timestamp = performance.now()
    
    const interactionData = {
      type: interactionType,
      timestamp,
      data,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }

    // Store locally for immediate access
    this.metrics.set(`interaction_${timestamp}`, interactionData)

    // Log to analytics if available
    if (window.BreakdownAnalytics) {
      window.BreakdownAnalytics.logInteraction(interactionType, interactionData)
    }
  }

  // Track resource loading
  trackResourceLoad(resourceName, startTime, endTime, size = null) {
    const loadTime = endTime - startTime
    
    const resourceData = {
      name: resourceName,
      loadTime,
      size,
      timestamp: Date.now()
    }

    this.metrics.set(`resource_${resourceName}_${Date.now()}`, resourceData)

    // Log slow resources
    if (loadTime > 2000) {
      console.warn(`🐌 Slow resource detected: ${resourceName} (${Math.round(loadTime)}ms)`)
    }
  }

  // Monitor memory usage
  getMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
        usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) // %
      }
    }
    return null
  }

  // Monitor network conditions
  getNetworkInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }
    }
    return null
  }

  // Get comprehensive performance report
  async getPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform
      },
      memory: this.getMemoryUsage(),
      network: this.getNetworkInfo(),
      metrics: Object.fromEntries(this.metrics),
      recommendations: await this.getRecommendations()
    }

    try {
      const workerSummary = await this.sendWorkerMessage('get_summary')
      report.workerAnalysis = workerSummary
    } catch (error) {
      console.warn('Could not get worker analysis:', error)
    }

    return report
  }

  // Start continuous monitoring
  startMonitoring() {
    if (!this.isSupported) return

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackUserInteraction('visibility_change', {
        hidden: document.hidden
      })
    })

    // Track unload to measure session duration
    window.addEventListener('beforeunload', () => {
      this.trackUserInteraction('session_end', {
        sessionDuration: performance.now()
      })
    })

    // Monitor long tasks if supported
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) { // Tasks over 50ms
              console.warn(`🐌 Long task detected: ${Math.round(entry.duration)}ms`)
              this.trackUserInteraction('long_task', {
                duration: entry.duration,
                startTime: entry.startTime
              })
            }
          })
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        console.warn('Long task monitoring not supported:', error)
      }
    }

    console.log('✅ Performance monitoring started')
  }

  // Cleanup resources
  cleanup() {
    if (this.worker) {
      this.sendWorkerMessage('cleanup')
    }
    
    this.metrics.clear()
    this.callbacks.clear()
  }

  // Handle processed analytics from worker
  handleAnalyticsProcessed(processedData) {
    // Send processed data to analytics service
    if (window.BreakdownAnalytics) {
      window.BreakdownAnalytics.bulkLog(processedData)
    }
  }
}

// Create and export singleton instance
export const performanceService = new PerformanceService()

// Auto-start monitoring when service is imported
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    performanceService.startMonitoring()
    performanceService.trackPageLoad()
  })

  // Make available globally for debugging
  window.performanceService = performanceService
}

export default performanceService