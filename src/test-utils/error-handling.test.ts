import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import React from 'react';
import ErrorBoundary, { PageErrorBoundary, ComponentErrorBoundary, GlobalErrorBoundary } from '@/components/ErrorBoundary';
import { errorMonitor } from '@/services/error-monitoring';
import { performanceMonitor } from '@/services/performance';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    getEntriesByType: vi.fn(() => []),
    memory: {
      usedJSHeapSize: 1024 * 1024 * 50, // 50MB
    },
  },
});

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Component that throws an error for testing
const ThrowingComponent: React.FC<{ shouldThrow: boolean; errorMessage: string }> = ({ 
  shouldThrow, 
  errorMessage 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return React.createElement('div', null, 'No error');
};

describe('**Feature: industry-grade-improvements, Property 15: Error Boundary Protection**', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should catch and handle React component errors gracefully without crashing the application', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.boolean(),
        (errorMessage, shouldThrow) => {
          const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
          
          try {
            const { container } = render(
              React.createElement(ErrorBoundary, null,
                React.createElement(ThrowingComponent, { shouldThrow, errorMessage })
              )
            );

            if (shouldThrow) {
              // Should show error UI instead of crashing
              expect(container.textContent).toContain('Something went wrong');
              expect(container.textContent).toContain('Try Again');
              expect(container.textContent).toContain('Reload Page');
              expect(container.textContent).toContain('Go Home');
              
              // Should not contain the original component content
              expect(container.textContent).not.toContain('No error');
            } else {
              // Should render normally when no error
              expect(container.textContent).toContain('No error');
              expect(container.textContent).not.toContain('Something went wrong');
            }

            return true;
          } catch (error) {
            // Error boundary should prevent this
            return false;
          } finally {
            consoleSpy.mockRestore();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide different error boundary levels (page, component, global)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('page', 'component', 'global'),
        fc.string({ minLength: 1, maxLength: 50 }),
        (boundaryType, errorMessage) => {
          const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
          
          try {
            let BoundaryComponent;
            switch (boundaryType) {
              case 'page':
                BoundaryComponent = PageErrorBoundary;
                break;
              case 'component':
                BoundaryComponent = ComponentErrorBoundary;
                break;
              case 'global':
                BoundaryComponent = GlobalErrorBoundary;
                break;
            }

            const { container } = render(
              React.createElement(BoundaryComponent, null,
                React.createElement(ThrowingComponent, { shouldThrow: true, errorMessage })
              )
            );

            // All boundary types should catch errors and show fallback UI
            expect(container.textContent).toContain('Something went wrong');
            expect(container.textContent).toContain('Try Again');

            return true;
          } catch (error) {
            return false;
          } finally {
            consoleSpy.mockRestore();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('**Feature: industry-grade-improvements, Property 17: Error Logging Completeness**', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
  });

  it('should log detailed error information for debugging purposes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.record({
          userId: fc.option(fc.string()),
          tags: fc.dictionary(fc.string(), fc.string()),
          extra: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
        }),
        (errorMessage, context) => {
          const error = new Error(errorMessage);
          
          // Set user if provided
          if (context.userId) {
            errorMonitor.setUser({ id: context.userId });
          }

          // Set tags and extra data
          Object.entries(context.tags).forEach(([key, value]) => {
            errorMonitor.setTag(key, value);
          });
          Object.entries(context.extra).forEach(([key, value]) => {
            errorMonitor.setExtra(key, value);
          });

          const errorId = errorMonitor.captureException(error, {
            tags: context.tags,
            extra: context.extra,
          });

          // Verify error was logged
          expect(errorId).toMatch(/^err_\d+_[a-z0-9]+$/);
          expect(mockLocalStorage.setItem).toHaveBeenCalled();

          // Verify logged data structure
          const setItemCalls = mockLocalStorage.setItem.mock.calls;
          const errorLogCall = setItemCalls.find(call => call[0] === 'error_logs');
          expect(errorLogCall).toBeDefined();

          const loggedData = JSON.parse(errorLogCall![1]);
          const latestLog = loggedData[loggedData.length - 1];

          expect(latestLog.id).toBe(errorId);
          expect(latestLog.message).toBe(errorMessage);
          expect(latestLog.name).toBe('Error');
          expect(typeof latestLog.timestamp).toBe('string');
          expect(typeof latestLog.url).toBe('string');
          expect(typeof latestLog.userAgent).toBe('string');
          expect(latestLog.level).toBe('error');

          // Verify context data is included
          if (context.userId) {
            expect(latestLog.user).toMatchObject({ id: context.userId });
          }
          expect(latestLog.tags).toMatchObject(context.tags);
          expect(latestLog.extra).toMatchObject(context.extra);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should capture and log messages with different severity levels', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.constantFrom('debug', 'info', 'warning', 'error', 'fatal'),
        (message, level) => {
          const messageId = errorMonitor.captureMessage(message, level);

          expect(messageId).toMatch(/^err_\d+_[a-z0-9]+$/);
          expect(mockLocalStorage.setItem).toHaveBeenCalled();

          const setItemCalls = mockLocalStorage.setItem.mock.calls;
          const messageLogCall = setItemCalls.find(call => call[0] === 'error_logs');
          expect(messageLogCall).toBeDefined();

          const loggedData = JSON.parse(messageLogCall![1]);
          const latestLog = loggedData[loggedData.length - 1];

          expect(latestLog.id).toBe(messageId);
          expect(latestLog.message).toBe(message);
          expect(latestLog.level).toBe(level);
          expect(typeof latestLog.timestamp).toBe('string');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('**Feature: industry-grade-improvements, Property 18: Performance Metrics Tracking**', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockLocalStorage.getItem.mockReturnValue('[]');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should track performance metrics and update them in real-time', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.record({
          tags: fc.dictionary(fc.string(), fc.string()),
          data: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer())),
        }),
        (transactionName, context) => {
          // Start a transaction
          const transaction = performanceMonitor.startTransaction(transactionName, context.tags);

          expect(transaction).toMatchObject({
            name: transactionName,
            startTime: expect.any(Number),
            tags: context.tags,
          });

          // Simulate some work
          const workDuration = Math.random() * 100;
          vi.advanceTimersByTime(workDuration);

          // Finish the transaction
          performanceMonitor.finishTransaction(transaction, context.data);

          expect(transaction.endTime).toBeDefined();
          expect(transaction.data).toEqual(context.data);

          // Verify performance data was logged
          expect(mockLocalStorage.setItem).toHaveBeenCalled();
          const setItemCalls = mockLocalStorage.setItem.mock.calls;
          const perfLogCall = setItemCalls.find(call => call[0] === 'performance_logs');
          expect(perfLogCall).toBeDefined();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should measure API call performance and track response times', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 10, max: 1000 }),
        fc.boolean(),
        async (endpoint, delay, shouldSucceed) => {
          const mockApiCall = shouldSucceed
            ? Promise.resolve({ data: 'success' })
            : Promise.reject(new Error('API Error'));

          try {
            const result = await performanceMonitor.measureApiCall(mockApiCall, endpoint);
            
            if (shouldSucceed) {
              expect(result).toEqual({ data: 'success' });
            }
          } catch (error) {
            if (!shouldSucceed) {
              expect(error).toBeInstanceOf(Error);
            }
          }

          // Verify performance data was logged regardless of success/failure
          expect(mockLocalStorage.setItem).toHaveBeenCalled();
          const setItemCalls = mockLocalStorage.setItem.mock.calls;
          const perfLogCall = setItemCalls.find(call => call[0] === 'performance_logs');
          expect(perfLogCall).toBeDefined();

          const loggedData = JSON.parse(perfLogCall![1]);
          const apiLog = loggedData.find((log: any) => 
            log.type === 'transaction' && log.name === `api_call_${endpoint}`
          );
          
          if (apiLog) {
            expect(apiLog.data.success).toBe(shouldSucceed);
            expect(apiLog.data.endpoint).toBe(endpoint);
            expect(typeof apiLog.data.duration).toBe('number');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track user interactions and maintain interaction history', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('click', 'scroll', 'input', 'navigation'),
        fc.option(fc.string({ minLength: 1, maxLength: 50 })),
        fc.option(fc.integer({ min: 1, max: 1000 })),
        (interactionType, element, duration) => {
          const interaction = {
            type: interactionType,
            element,
            timestamp: Date.now(),
            duration,
            data: { test: true },
          };

          performanceMonitor.trackUserInteraction(interaction);

          // Verify interaction was logged
          expect(mockLocalStorage.setItem).toHaveBeenCalled();
          const setItemCalls = mockLocalStorage.setItem.mock.calls;
          const perfLogCall = setItemCalls.find(call => call[0] === 'performance_logs');
          expect(perfLogCall).toBeDefined();

          const loggedData = JSON.parse(perfLogCall![1]);
          const interactionLog = loggedData.find((log: any) => 
            log.type === interactionType && log.element === element
          );
          
          if (interactionLog) {
            expect(interactionLog.type).toBe(interactionType);
            if (element) {
              expect(interactionLog.element).toBe(element);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate comprehensive performance metrics reports', () => {
    fc.assert(
      fc.property(
        fc.record({
          pageLoadTime: fc.float({ min: 0, max: 5000 }),
          apiResponseTime: fc.float({ min: 0, max: 2000 }),
          memoryUsage: fc.float({ min: 0, max: 1000 }),
        }),
        (mockMetrics) => {
          // Mock performance navigation timing
          vi.mocked(window.performance.getEntriesByType).mockReturnValue([
            {
              fetchStart: 0,
              loadEventEnd: mockMetrics.pageLoadTime,
            } as PerformanceNavigationTiming,
          ]);

          const metrics = performanceMonitor.getMetrics();

          expect(metrics).toMatchObject({
            pageLoadTime: expect.any(Number),
            apiResponseTime: expect.any(Number),
            renderTime: expect.any(Number),
            memoryUsage: expect.any(Number),
            bundleSize: expect.any(Number),
            firstContentfulPaint: expect.any(Number),
            largestContentfulPaint: expect.any(Number),
            firstInputDelay: expect.any(Number),
            cumulativeLayoutShift: expect.any(Number),
          });

          // All metrics should be non-negative numbers
          Object.values(metrics).forEach(value => {
            expect(typeof value).toBe('number');
            expect(value).toBeGreaterThanOrEqual(0);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});