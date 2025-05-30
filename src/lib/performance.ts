import prisma from './prisma';

// Performance monitoring types
interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: number;
    route?: string;
    userId?: string;
    sessionId?: string;
    tags?: Record<string, string>;
}

interface PagePerformance {
    url: string;
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
    timeToInteractive: number;
}

// In-memory storage for performance metrics (would be Redis in production)
const performanceMetrics: PerformanceMetric[] = [];
const MAX_STORED_METRICS = 10000;

// Core Web Vitals thresholds
const THRESHOLDS = {
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    TTFB: { good: 800, needsImprovement: 1800 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTI: { good: 3800, needsImprovement: 7300 },
};

// Performance metrics collection
export function collectMetric(metric: PerformanceMetric) {
    performanceMetrics.push({
        ...metric,
        timestamp: metric.timestamp || Date.now(),
    });

    // Keep only the latest metrics
    if (performanceMetrics.length > MAX_STORED_METRICS) {
        performanceMetrics.splice(0, performanceMetrics.length - MAX_STORED_METRICS);
    }

    // Log critical performance issues
    if (isCriticalMetric(metric)) {
        console.warn(`Critical performance issue detected:`, metric);
    }
}

function isCriticalMetric(metric: PerformanceMetric): boolean {
    switch (metric.name) {
        case 'LCP':
            return metric.value > THRESHOLDS.LCP.needsImprovement;
        case 'FID':
            return metric.value > THRESHOLDS.FID.needsImprovement;
        case 'CLS':
            return metric.value > THRESHOLDS.CLS.needsImprovement;
        case 'TTFB':
            return metric.value > THRESHOLDS.TTFB.needsImprovement;
        default:
            return false;
    }
}

// Database performance monitoring
export async function trackDatabaseQuery(
    query: string,
    duration: number,
    userId?: string
) {
    collectMetric({
        name: 'database_query_duration',
        value: duration,
        timestamp: Date.now(),
        userId,
        tags: {
            type: 'database',
            query: query.substring(0, 100), // Truncate for privacy
        },
    });

    // Log slow queries
    if (duration > 1000) { // 1 second threshold
        console.warn(`Slow database query detected: ${duration}ms`, {
            query: query.substring(0, 200),
            userId,
        });
    }
}

// API route performance monitoring
export function createPerformanceMiddleware() {
    return (req: any, res: any, next: any) => {
        const startTime = Date.now();
        const route = req.route?.path || req.url;

        res.on('finish', () => {
            const duration = Date.now() - startTime;

            collectMetric({
                name: 'api_response_time',
                value: duration,
                timestamp: Date.now(),
                route,
                userId: req.user?.id,
                tags: {
                    method: req.method,
                    statusCode: res.statusCode.toString(),
                    type: 'api',
                },
            });

            // Log slow API calls
            if (duration > 2000) { // 2 second threshold
                console.warn(`Slow API response: ${duration}ms`, {
                    route,
                    method: req.method,
                    statusCode: res.statusCode,
                });
            }
        });

        next();
    };
}

// Client-side performance tracking
export function trackPagePerformance(performance: PagePerformance) {
    // Track Core Web Vitals
    collectMetric({
        name: 'LCP',
        value: performance.largestContentfulPaint,
        timestamp: Date.now(),
        route: performance.url,
        tags: { type: 'core_web_vital' },
    });

    collectMetric({
        name: 'FID',
        value: performance.firstInputDelay,
        timestamp: Date.now(),
        route: performance.url,
        tags: { type: 'core_web_vital' },
    });

    collectMetric({
        name: 'CLS',
        value: performance.cumulativeLayoutShift,
        timestamp: Date.now(),
        route: performance.url,
        tags: { type: 'core_web_vital' },
    });

    // Track other metrics
    collectMetric({
        name: 'page_load_time',
        value: performance.loadTime,
        timestamp: Date.now(),
        route: performance.url,
        tags: { type: 'page_performance' },
    });

    collectMetric({
        name: 'FCP',
        value: performance.firstContentfulPaint,
        timestamp: Date.now(),
        route: performance.url,
        tags: { type: 'page_performance' },
    });

    collectMetric({
        name: 'TTI',
        value: performance.timeToInteractive,
        timestamp: Date.now(),
        route: performance.url,
        tags: { type: 'page_performance' },
    });
}

// Memory usage monitoring
export function trackMemoryUsage() {
    if (typeof window !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory;

        collectMetric({
            name: 'memory_used',
            value: memory.usedJSHeapSize,
            timestamp: Date.now(),
            tags: { type: 'memory' },
        });

        collectMetric({
            name: 'memory_total',
            value: memory.totalJSHeapSize,
            timestamp: Date.now(),
            tags: { type: 'memory' },
        });

        collectMetric({
            name: 'memory_limit',
            value: memory.jsHeapSizeLimit,
            timestamp: Date.now(),
            tags: { type: 'memory' },
        });
    }
}

// Performance analytics
export function getPerformanceAnalytics(timeRange: {
    start: number;
    end: number;
}) {
    const filteredMetrics = performanceMetrics.filter(
        (metric) => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );

    const analytics: Record<string, any> = {};

    // Group metrics by name
    const groupedMetrics = filteredMetrics.reduce((groups, metric) => {
        if (!groups[metric.name]) {
            groups[metric.name] = [];
        }
        groups[metric.name].push(metric);
        return groups;
    }, {} as Record<string, PerformanceMetric[]>);

    // Calculate statistics for each metric
    Object.entries(groupedMetrics).forEach(([name, metrics]) => {
        const values = metrics.map((m) => m.value);

        analytics[name] = {
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((sum, val) => sum + val, 0) / values.length,
            p50: percentile(values, 0.5),
            p90: percentile(values, 0.9),
            p99: percentile(values, 0.99),
        };
    });

    return analytics;
}

function percentile(values: number[], p: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
}

// Core Web Vitals scoring
export function getCoreWebVitalsScore(
    lcp: number,
    fid: number,
    cls: number
): {
    score: number;
    grade: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
    details: Record<string, any>;
} {
    const lcpScore = lcp <= THRESHOLDS.LCP.good ? 100 :
        lcp <= THRESHOLDS.LCP.needsImprovement ? 50 : 0;

    const fidScore = fid <= THRESHOLDS.FID.good ? 100 :
        fid <= THRESHOLDS.FID.needsImprovement ? 50 : 0;

    const clsScore = cls <= THRESHOLDS.CLS.good ? 100 :
        cls <= THRESHOLDS.CLS.needsImprovement ? 50 : 0;

    const totalScore = (lcpScore + fidScore + clsScore) / 3;

    let grade: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
    if (totalScore >= 90) grade = 'GOOD';
    else if (totalScore >= 50) grade = 'NEEDS_IMPROVEMENT';
    else grade = 'POOR';

    return {
        score: Math.round(totalScore),
        grade,
        details: {
            lcp: { value: lcp, score: lcpScore, threshold: THRESHOLDS.LCP },
            fid: { value: fid, score: fidScore, threshold: THRESHOLDS.FID },
            cls: { value: cls, score: clsScore, threshold: THRESHOLDS.CLS },
        },
    };
}

// Resource timing monitoring
export function trackResourceTiming() {
    if (typeof window !== 'undefined' && 'getEntriesByType' in performance) {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

        resources.forEach((resource) => {
            collectMetric({
                name: 'resource_load_time',
                value: resource.responseEnd - resource.startTime,
                timestamp: Date.now(),
                tags: {
                    type: 'resource',
                    resourceType: resource.initiatorType,
                    url: resource.name,
                },
            });
        });
    }
}

// Error tracking with performance impact
export function trackErrorWithPerformance(error: Error, context?: any) {
    collectMetric({
        name: 'error_occurred',
        value: 1,
        timestamp: Date.now(),
        tags: {
            type: 'error',
            message: error.message,
            stack: error.stack?.substring(0, 500),
            ...context,
        },
    });
}

// Performance budget monitoring
export const PERFORMANCE_BUDGETS = {
    'dashboard': {
        loadTime: 3000,
        firstContentfulPaint: 1500,
        largestContentfulPaint: 2500,
    },
    'schedule': {
        loadTime: 2000,
        firstContentfulPaint: 1200,
        largestContentfulPaint: 2000,
    },
    'chat': {
        loadTime: 1500,
        firstContentfulPaint: 1000,
        largestContentfulPaint: 1800,
    },
};

export function checkPerformanceBudget(route: string, metrics: PagePerformance) {
    const budget = PERFORMANCE_BUDGETS[route as keyof typeof PERFORMANCE_BUDGETS];
    if (!budget) return null;

    const violations: string[] = [];

    if (metrics.loadTime > budget.loadTime) {
        violations.push(`Load time exceeded budget: ${metrics.loadTime}ms > ${budget.loadTime}ms`);
    }

    if (metrics.firstContentfulPaint > budget.firstContentfulPaint) {
        violations.push(`FCP exceeded budget: ${metrics.firstContentfulPaint}ms > ${budget.firstContentfulPaint}ms`);
    }

    if (metrics.largestContentfulPaint > budget.largestContentfulPaint) {
        violations.push(`LCP exceeded budget: ${metrics.largestContentfulPaint}ms > ${budget.largestContentfulPaint}ms`);
    }

    return {
        passed: violations.length === 0,
        violations,
    };
}

// Real User Monitoring (RUM)
export function initializeRUM() {
    if (typeof window === 'undefined') return;

    // Track page load performance
    window.addEventListener('load', () => {
        setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

            if (navigation) {
                trackPagePerformance({
                    url: window.location.pathname,
                    loadTime: navigation.loadEventEnd - navigation.fetchStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                    firstContentfulPaint: 0, // Would be set by performance observer
                    largestContentfulPaint: 0, // Would be set by performance observer
                    cumulativeLayoutShift: 0, // Would be set by performance observer
                    firstInputDelay: 0, // Would be set by performance observer
                    timeToInteractive: 0, // Would be calculated
                });
            }

            // Track resource timing
            trackResourceTiming();

            // Track memory usage
            trackMemoryUsage();
        }, 0);
    });

    // Track errors
    window.addEventListener('error', (event) => {
        trackErrorWithPerformance(event.error, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
        });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        trackErrorWithPerformance(new Error(event.reason), {
            type: 'unhandled_promise_rejection',
        });
    });
}

// Cleanup function
export function cleanup() {
    performanceMetrics.length = 0;
} 