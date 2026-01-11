interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: LogLevel;
  user?: {
    id: string;
    email?: string;
  };
}

interface Breadcrumb {
  message: string;
  category: string;
  level: LogLevel;
  timestamp: Date;
  data?: Record<string, unknown>;
}

type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

interface ErrorMonitor {
  captureException: (error: Error, context?: ErrorContext) => string;
  captureMessage: (message: string, level?: LogLevel, context?: ErrorContext) => string;
  setUser: (user: { id: string; email?: string }) => void;
  addBreadcrumb: (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => void;
  setTag: (key: string, value: string) => void;
  setExtra: (key: string, value: unknown) => void;
  flush: () => Promise<void>;
}

class ErrorMonitoringService implements ErrorMonitor {
  private breadcrumbs: Breadcrumb[] = [];
  private user: { id: string; email?: string } | null = null;
  private tags: Record<string, string> = {};
  private extra: Record<string, unknown> = {};
  private maxBreadcrumbs = 50;

  captureException(error: Error, context?: ErrorContext): string {
    const errorId = this.generateErrorId();
    
    const errorData = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      user: context?.user || this.user,
      tags: { ...this.tags, ...context?.tags },
      extra: { ...this.extra, ...context?.extra },
      level: context?.level || 'error',
      breadcrumbs: [...this.breadcrumbs],
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', errorData);
    }

    // Send to monitoring service (implement based on your monitoring solution)
    this.sendToMonitoringService(errorData);

    // Add breadcrumb for this error
    this.addBreadcrumb({
      message: `Error: ${error.message}`,
      category: 'error',
      level: 'error',
      data: { errorId },
    });

    return errorId;
  }

  captureMessage(message: string, level: LogLevel = 'info', context?: ErrorContext): string {
    const messageId = this.generateErrorId();
    
    const messageData = {
      id: messageId,
      message,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      user: context?.user || this.user,
      tags: { ...this.tags, ...context?.tags },
      extra: { ...this.extra, ...context?.extra },
      level,
      breadcrumbs: [...this.breadcrumbs],
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Message captured [${level}]:`, messageData);
    }

    // Send to monitoring service
    this.sendToMonitoringService(messageData);

    // Add breadcrumb for this message
    this.addBreadcrumb({
      message,
      category: 'message',
      level,
      data: { messageId },
    });

    return messageId;
  }

  setUser(user: { id: string; email?: string }): void {
    this.user = user;
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: new Date(),
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  setTag(key: string, value: string): void {
    this.tags[key] = value;
  }

  setExtra(key: string, value: unknown): void {
    this.extra[key] = value;
  }

  async flush(): Promise<void> {
    // Implement if you need to flush pending events
    return Promise.resolve();
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendToMonitoringService(data: unknown): Promise<void> {
    try {
      // In a real implementation, you would send this to your monitoring service
      // For now, we'll store it locally and log it
      
      // Store in localStorage for development/debugging
      const stored = localStorage.getItem('error_logs') || '[]';
      const logs = JSON.parse(stored);
      logs.push(data);
      
      // Keep only the last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('error_logs', JSON.stringify(logs));

      // In production, you might send to services like:
      // - Sentry: await fetch('https://sentry.io/api/...', { method: 'POST', body: JSON.stringify(data) })
      // - LogRocket: LogRocket.captureException(error)
      // - Custom endpoint: await fetch('/api/errors', { method: 'POST', body: JSON.stringify(data) })
      
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  }
}

// Create singleton instance
export const errorMonitor = new ErrorMonitoringService();

// Utility functions for common error scenarios
export const captureApiError = (error: Error, endpoint: string, method: string) => {
  return errorMonitor.captureException(error, {
    tags: {
      type: 'api_error',
      endpoint,
      method,
    },
    extra: {
      endpoint,
      method,
    },
  });
};

export const captureUserAction = (action: string, data?: Record<string, unknown>) => {
  errorMonitor.addBreadcrumb({
    message: `User action: ${action}`,
    category: 'user',
    level: 'info',
    data,
  });
};

export const captureNavigation = (from: string, to: string) => {
  errorMonitor.addBreadcrumb({
    message: `Navigation: ${from} → ${to}`,
    category: 'navigation',
    level: 'info',
    data: { from, to },
  });
};

// Hook for React components to easily use error monitoring
export const useErrorMonitoring = () => {
  return {
    captureException: errorMonitor.captureException.bind(errorMonitor),
    captureMessage: errorMonitor.captureMessage.bind(errorMonitor),
    addBreadcrumb: errorMonitor.addBreadcrumb.bind(errorMonitor),
    captureApiError,
    captureUserAction,
  };
};

export type { ErrorContext, Breadcrumb, LogLevel, ErrorMonitor };