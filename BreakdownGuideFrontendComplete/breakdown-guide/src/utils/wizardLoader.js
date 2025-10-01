import { lazy } from 'react'

// Dynamic wizard loader with caching
class WizardLoader {
  constructor() {
    this.wizardCache = new Map()
    this.loadingPromises = new Map()
  }

  // Get wizard component with caching and lazy loading
  async getWizardComponent(wizardType) {
    // Check cache first
    if (this.wizardCache.has(wizardType)) {
      return this.wizardCache.get(wizardType)
    }

    // Check if already loading
    if (this.loadingPromises.has(wizardType)) {
      return this.loadingPromises.get(wizardType)
    }

    // Create loading promise
    const loadingPromise = this.loadWizard(wizardType)
    this.loadingPromises.set(wizardType, loadingPromise)

    try {
      const component = await loadingPromise
      this.wizardCache.set(wizardType, component)
      this.loadingPromises.delete(wizardType)
      return component
    } catch (error) {
      this.loadingPromises.delete(wizardType)
      throw error
    }
  }

  // Load wizard component dynamically
  async loadWizard(wizardType) {
    // Try modern lazy component first
    try {
      const LazyComponent = lazy(() => 
        import(`@components/wizards/${wizardType}Wizard.jsx`)
          .catch(() => import(`@components/wizards/${wizardType}Wizard.js`))
      )
      return LazyComponent
    } catch (modernError) {
      console.warn(`Modern wizard not found for ${wizardType}, falling back to legacy`)
      
      // Fallback to legacy global component
      const legacyComponent = window[`${wizardType}Wizard`]
      if (legacyComponent) {
        return legacyComponent
      }
      
      // Ultimate fallback - load via script tag if needed
      console.warn(`Legacy wizard not found for ${wizardType}, attempting dynamic load`)
      return this.loadLegacyWizard(wizardType)
    }
  }

  // Load legacy wizard via script tag
  async loadLegacyWizard(wizardType) {
    return new Promise((resolve, reject) => {
      const scriptId = `wizard-${wizardType.toLowerCase()}`
      
      // Check if script already exists
      if (document.getElementById(scriptId)) {
        const component = window[`${wizardType}Wizard`]
        return component ? resolve(component) : reject(new Error(`Wizard ${wizardType} not found after script load`))
      }

      // Create and load script
      const script = document.createElement('script')
      script.id = scriptId
      script.src = `/breakdown-guide/components/wizards/${wizardType}Wizard.js`
      script.async = true
      
      script.onload = () => {
        const component = window[`${wizardType}Wizard`]
        if (component) {
          resolve(component)
        } else {
          reject(new Error(`Wizard component ${wizardType}Wizard not found on window object`))
        }
      }
      
      script.onerror = () => {
        reject(new Error(`Failed to load wizard script for ${wizardType}`))
      }
      
      document.head.appendChild(script)
    })
  }

  // Preload commonly used wizards
  async preloadCriticalWizards() {
    const criticalWizards = [
      'Steering',
      'Brakes', 
      'NonStarter',
      'ABS_Light',
      'OilWarningLight'
    ]

    const preloadPromises = criticalWizards.map(wizardType => 
      this.getWizardComponent(wizardType)
        .catch(error => {
          console.warn(`Failed to preload wizard ${wizardType}:`, error)
          return null
        })
    )

    await Promise.allSettled(preloadPromises)
    console.log('✅ Critical wizards preloaded')
  }

  // Get all available wizard types
  getAvailableWizardTypes() {
    const wizardTypes = [
      'Steering', 'Brakes', 'ABSLight', 'OilWarningLight', 'InteriorLights',
      'ExteriorLights', 'WheelchairRamp', 'DestinationDisplay', 'Battery',
      'CoolingSystem', 'DemistersHeaters', 'RepeatDefects', 'RoadTrafficIncidents',
      'TracerItHelper', 'LooseWheelNuts', 'Puncture', 'NonStarter',
      'Doors', 'GearSelection', 'Gearbox', 'Buzzers', 'WarningLights',
      'ExcessiveSmoke', 'Suspension', 'WipersScreenwash', 'LowWater',
      'BrokenWindows', 'WingMirrors', 'Speedo', 'CuttingOutFuel',
      'InteriorExteriorDamage'
    ]

    return wizardTypes.filter(type => {
      // Check if wizard exists in cache or on window object
      return this.wizardCache.has(type) || window[`${type}Wizard`]
    })
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.wizardCache.clear()
    this.loadingPromises.clear()
    console.log('🧹 Wizard cache cleared')
  }

  // Get cache statistics
  getCacheStats() {
    return {
      cached: this.wizardCache.size,
      loading: this.loadingPromises.size,
      cachedWizards: Array.from(this.wizardCache.keys())
    }
  }
}

// Create singleton instance
export const wizardLoader = new WizardLoader()

// React hook for wizard loading
export const useWizardLoader = () => {
  return {
    getWizardComponent: wizardLoader.getWizardComponent.bind(wizardLoader),
    preloadCriticalWizards: wizardLoader.preloadCriticalWizards.bind(wizardLoader),
    getAvailableWizardTypes: wizardLoader.getAvailableWizardTypes.bind(wizardLoader),
    getCacheStats: wizardLoader.getCacheStats.bind(wizardLoader),
    clearCache: wizardLoader.clearCache.bind(wizardLoader)
  }
}

// Performance monitoring wrapper
export const withPerformanceTracking = (WrappedComponent, wizardType) => {
  return React.forwardRef((props, ref) => {
    React.useEffect(() => {
      if ('performance' in window) {
        performance.mark(`wizard-${wizardType}-start`)
        
        return () => {
          performance.mark(`wizard-${wizardType}-end`)
          performance.measure(
            `wizard-${wizardType}-duration`,
            `wizard-${wizardType}-start`,
            `wizard-${wizardType}-end`
          )
          
          const measure = performance.getEntriesByName(`wizard-${wizardType}-duration`)[0]
          if (measure && window.BreakdownAnalytics) {
            window.BreakdownAnalytics.logPerformance('WIZARD_LOAD', {
              wizardType,
              duration: measure.duration
            })
          }
        }
      }
    }, [])

    return <WrappedComponent ref={ref} {...props} />
  })
}

export default wizardLoader