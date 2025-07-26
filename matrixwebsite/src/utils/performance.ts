// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Record<string, number[]> = {}
  private observer?: PerformanceObserver

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  constructor() {
    this.initializeObserver()
  }

  private initializeObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.duration || entry.startTime)
        }
      })

      try {
        this.observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] })
      } catch (e) {
        console.warn('Performance Observer not fully supported:', e)
      }
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics[name]) {
      this.metrics[name] = []
    }
    this.metrics[name].push(value)
    
    // Keep only last 100 measurements
    if (this.metrics[name].length > 100) {
      this.metrics[name] = this.metrics[name].slice(-100)
    }
  }

  getMetric(name: string) {
    const values = this.metrics[name] || []
    if (values.length === 0) return null

    return {
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1],
      count: values.length
    }
  }

  getAllMetrics() {
    const result: Record<string, any> = {}
    for (const [name] of Object.entries(this.metrics)) {
      result[name] = this.getMetric(name)
    }
    return result
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    return fn().finally(() => {
      const end = performance.now()
      this.recordMetric(name, end - start)
    })
  }

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    try {
      return fn()
    } finally {
      const end = performance.now()
      this.recordMetric(name, end - start)
    }
  }

  // Web Vitals tracking
  trackWebVitals() {
    // Track First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('FCP', entry.startTime)
        }
      }
    }).observe({ entryTypes: ['paint'] })

    // Track Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.recordMetric('LCP', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // Track Cumulative Layout Shift
    let clsValue = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
          this.recordMetric('CLS', clsValue)
        }
      }
    }).observe({ entryTypes: ['layout-shift'] })
  }

  // Memory usage tracking
  trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.recordMetric('memory.used', memory.usedJSHeapSize)
      this.recordMetric('memory.total', memory.totalJSHeapSize)
      this.recordMetric('memory.limit', memory.jsHeapSizeLimit)
    }
  }

  // Export metrics for analytics
  exportMetrics() {
    return {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.getAllMetrics(),
      navigation: this.getNavigationTiming(),
      resources: this.getResourceTiming()
    }
  }

  private getNavigationTiming() {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (!nav) return null

    return {
      dns: nav.domainLookupEnd - nav.domainLookupStart,
      tcp: nav.connectEnd - nav.connectStart,
      ssl: nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0,
      ttfb: nav.responseStart - nav.requestStart,
      download: nav.responseEnd - nav.responseStart,
      domParse: nav.domContentLoadedEventStart - nav.responseEnd,
      domReady: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
      loadComplete: nav.loadEventEnd - nav.loadEventStart
    }
  }

  private getResourceTiming() {
    const resources = performance.getEntriesByType('resource')
    const summary: Record<string, any> = {}

    resources.forEach((resource) => {
      const type = this.getResourceType(resource.name)
      if (!summary[type]) {
        summary[type] = { count: 0, totalSize: 0, totalTime: 0 }
      }
      summary[type].count++
      summary[type].totalTime += resource.duration
      if ('transferSize' in resource) {
        summary[type].totalSize += (resource as any).transferSize
      }
    })

    return summary
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|eot)/)) return 'font'
    if (url.includes('api/') || url.includes('/api')) return 'api'
    return 'other'
  }
}

// Image optimization utilities
export class ImageOptimizer {
  private static cache = new Map<string, string>()

  static async optimizeImage(file: File, maxWidth = 1920, quality = 0.8): Promise<string> {
    const cacheKey = `${file.name}-${file.size}-${maxWidth}-${quality}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        const { width, height } = this.calculateDimensions(img.width, img.height, maxWidth)
        canvas.width = width
        canvas.height = height

        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedUrl = URL.createObjectURL(blob)
              this.cache.set(cacheKey, optimizedUrl)
              resolve(optimizedUrl)
            } else {
              reject(new Error('Failed to optimize image'))
            }
          },
          'image/webp',
          quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  private static calculateDimensions(originalWidth: number, originalHeight: number, maxWidth: number) {
    if (originalWidth <= maxWidth) {
      return { width: originalWidth, height: originalHeight }
    }

    const aspectRatio = originalWidth / originalHeight
    const width = maxWidth
    const height = Math.round(width / aspectRatio)

    return { width, height }
  }

  static createResponsiveImageSrcSet(baseUrl: string, sizes: number[] = [320, 640, 1024, 1920]): string {
    return sizes
      .map(size => `${baseUrl}?w=${size}&q=80 ${size}w`)
      .join(', ')
  }

  static lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]')
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src
            if (src) {
              img.src = src
              img.removeAttribute('data-src')
              imageObserver.unobserve(img)
            }
          }
        })
      })

      images.forEach((img) => imageObserver.observe(img))
    } else {
      // Fallback for older browsers
      images.forEach((img) => {
        const imgElement = img as HTMLImageElement
        const src = imgElement.dataset.src
        if (src) {
          imgElement.src = src
          imgElement.removeAttribute('data-src')
        }
      })
    }
  }
}

// Caching utilities
export class CacheManager {
  private static readonly CACHE_VERSION = 'v1'
  private static readonly CACHE_NAME = `polybets-cache-${this.CACHE_VERSION}`

  static async cacheResources(urls: string[]) {
    if ('caches' in window) {
      const cache = await caches.open(this.CACHE_NAME)
      await cache.addAll(urls)
    }
  }

  static async getCachedResponse(url: string): Promise<Response | null> {
    if ('caches' in window) {
      const cache = await caches.open(this.CACHE_NAME)
      return await cache.match(url) || null
    }
    return null
  }

  static async clearOldCaches() {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter(name => name !== this.CACHE_NAME)
          .map(name => caches.delete(name))
      )
    }
  }

  // Memory-based cache for API responses
  private static memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  static setMemoryCache(key: string, data: any, ttlMs = 5 * 60 * 1000) {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  static getMemoryCache<T>(key: string): T | null {
    const cached = this.memoryCache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.memoryCache.delete(key)
      return null
    }

    return cached.data
  }

  static clearMemoryCache() {
    this.memoryCache.clear()
  }
}

// Bundle analyzer for production builds
export class BundleAnalyzer {
  static analyzeChunks() {
    if (process.env.NODE_ENV !== 'production') return

    const chunks = this.getLoadedChunks()
    const analysis = {
      totalSize: 0,
      chunkCount: chunks.length,
      largestChunk: { name: '', size: 0 },
      smallestChunk: { name: '', size: Infinity },
      unusedChunks: this.findUnusedChunks(chunks)
    }

    chunks.forEach(chunk => {
      analysis.totalSize += chunk.size
      if (chunk.size > analysis.largestChunk.size) {
        analysis.largestChunk = { name: chunk.name, size: chunk.size }
      }
      if (chunk.size < analysis.smallestChunk.size) {
        analysis.smallestChunk = { name: chunk.name, size: chunk.size }
      }
    })

    console.table(analysis)
    return analysis
  }

  private static getLoadedChunks() {
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    return scripts.map(script => ({
      name: (script as HTMLScriptElement).src.split('/').pop() || 'unknown',
      size: this.estimateScriptSize(script as HTMLScriptElement)
    }))
  }

  private static estimateScriptSize(script: HTMLScriptElement): number {
    // This is an estimation - in a real app you'd track actual sizes
    const src = script.src
    if (src.includes('vendor')) return 500000 // ~500KB
    if (src.includes('main')) return 200000 // ~200KB
    return 50000 // ~50KB default
  }

  private static findUnusedChunks(_chunks: any[]): string[] {
    // In a real implementation, you'd track which chunks are actually executed
    return []
  }
}
