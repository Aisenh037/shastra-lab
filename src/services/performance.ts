interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

interface Transaction {
  name: string;
  startTime: number;
  endTime?: number;
  tags?: Record<string, string>;
  data?: Record<string, unknown>;
}

interface UserInteractionEvent {
  type: 'click' | 'scroll' | 'input' | 'navigation';
  element?: string;
  timestamp: number;
  duration?: number;
  data?: Record<string, unknown>;
}

interface PerformanceMonitor {
  startTransaction: (name: string, tags?: Record<string, string>) => Transaction;
  finishTransaction: (transaction: Transaction, data?: Record<string, unknown>) => void;
  measureApiCall: <T>(promise: Promise<T>, endpoint: string) => Promise<T>;
  trackUserInteraction: (event: UserInteractionEvent) => void;
  getMetrics: () => PerformanceMetrics;
  reportMetrics: () => void;
}

class PerformanceMonitoringService implements PerformanceMonitor {
  private transactions: Map<string, Transaction> = new Map();
  private metrics: Partial<PerformanceMetrics> = {};
  private interactions: UserInteractionEvent[] = [];
  private maxInteractions = 100;

  constructor() {
    this.initializeWebVitals();
    this.setupPerformanceObserver();
  }

  startTransaction(name: string, tags?: Record<string, string>): Transaction {
    const transaction: Transaction = {
      name,
      startTime: performance.now(),
      tags,
    };

    this.transactions.set(name, transaction);
    return transaction;
  }

  finishTransaction(transaction: Transaction, data?: Record<string, unknown>): void {
    transaction.endTime = performance.now();
    transaction.data = data;

    const duration = transaction.endTime - transaction.startTime;

    // Log performance data
    if (process.env.NODE_ENV === 'development') {
      console.log(`Transaction "${transaction.name}" completed in ${duration.toFixed(2)}ms`, {
        transaction,
        duration,
      });
    }

    // Send to monitoring service
    this.sendPerformanceData({
      type: 'transaction',
      name: transaction.name,
      duration,
      tags: transaction.tags,
      data: transaction.data,
      timestamp: Date.now(),
    });

    this.transactions.delete(transaction.name);
  }

  async measureApiCall<T>(promise: Promise<T>, endpoint: string): Promise<T> {
    const transaction = this.startTransaction(`api_call_${endpoint}`, {
      type: 'api',
      endpoint,
    });

    const startTime = performance.now();

    try {
      const result = await promise;
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.finishTransaction(transaction, {
        success: true,
        duration,
        endpoint,
      });

      // Update API response time metric
      this.metrics.apiResponseTime = duration;

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.finishTransaction(transaction, {
        success: false,
        duration,
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  trackUserInteraction(event: UserInteractionEvent): void {
    this.interactions.push(event);

    // Keep only the most recent interactions
    if (this.interactions.length > this.maxInteractions) {
      this.interactions = this.interactions.slice(-this.maxInteractions);
    }

    // Send interaction data
    this.sendPerformanceData({
      type: 'interaction',
      ...event,
    });
  }

  getMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      apiResponseTime: this.metrics.apiResponseTime || 0,
      renderTime: this.metrics.renderTime || 0,
      memoryUsage: this.getMemoryUsage(),
      bundleSize: this.metrics.bundleSize || 0,
      firstContentfulPaint: this.metrics.firstContentfulPaint || 0,
      largestContentfulPaint: this.metrics.largestContentfulPaint || 0,
      firstInputDelay: this.metrics.firstInputDelay || 0,
      cumulativeLayoutShift: this.metrics.cumulativeLayoutShift || 0,
    };
  }

  reportMetrics(): void {
    const metrics = this.getMetrics();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metrics:', metrics);
    }

    this.sendPerformanceData({
      type: 'metrics_report',
      metrics,
      timestamp: Date.now(),
      url: window.location.href,
    });
  }

  private initializeWebVitals(): void {
    // Measure First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Measure Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.largestContentfulPaint = lastEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Measure First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
      }
    }).observe({ entryTypes: ['first-input'] });

    // Measure Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          this.metrics.cumulativeLayoutShift = clsValue;
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private setupPerformanceObserver(): void {
    // Observe resource loading
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          this.sendPerformanceData({
            type: 'resource_load',
            name: entry.name,
            duration: entry.duration,
            size: (entry as any).transferSize || 0,
            timestamp: Date.now(),
          });
        }
      }
    }).observe({ entryTypes: ['resource'] });
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private async sendPerformanceData(data: unknown): Promise<void> {
    try {
      // Store performance data locally
      const stored = localStorage.getItem('performance_logs') || '[]';
      const logs = JSON.parse(stored);
      logs.push(data);
      
      // Keep only the last 200 entries
      if (logs.length > 200) {
        logs.splice(0, logs.length - 200);
      }
      
      localStorage.setItem('performance_logs', JSON.stringify(logs));

      // In production, send to monitoring service
      // await fetch('/api/performance', { method: 'POST', body: JSON.stringify(data) });
      
    } catch (error) {
      console.error('Failed to send performance data:', error);
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitoringService();

// Utility functions
export const measureRenderTime = (componentName: string) => {
  const transaction = performanceMonitor.startTransaction(`render_${componentName}`, {
    type: 'render',
    component: componentName,
  });

  return () => {
    performanceMonitor.finishTransaction(transaction);
  };
};

export const trackPageView = (pageName: string) => {
  performanceMonitor.trackUserInteraction({
    type: 'navigation',
    element: pageName,
    timestamp: Date.now(),
  });
};

// React hook for performance monitoring
export const usePerformanceMonitoring = () => {
  return {
    startTransaction: performanceMonitor.startTransaction.bind(performanceMonitor),
    finishTransaction: performanceMonitor.finishTransaction.bind(performanceMonitor),
    measureApiCall: performanceMonitor.measureApiCall.bind(performanceMonitor),
    trackUserInteraction: performanceMonitor.trackUserInteraction.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    measureRenderTime,
    trackPageView,
  };
};

export type { PerformanceMetrics, Transaction, UserInteractionEvent, PerformanceMonitor };