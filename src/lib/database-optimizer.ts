import prisma from './prisma';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
    SLOW_QUERY_MS: 1000,
    VERY_SLOW_QUERY_MS: 3000,
    WARNING_CONNECTIONS: 80,
    CRITICAL_CONNECTIONS: 95,
    MAX_CACHE_SIZE: 1000,
} as const;

interface QueryMetric {
    query: string;
    duration: number;
    timestamp: number;
    userId?: string;
    table?: string;
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';
    recordCount?: number;
    cached?: boolean;
}

interface DatabaseHealth {
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
        avgQueryTime: number;
        slowQueries: number;
        totalQueries: number;
        cacheHitRate: number;
        activeConnections: number;
        memory: {
            used: number;
            percentage: number;
        };
    };
    recommendations: string[];
    slowQueries: QueryMetric[];
    timestamp: number;
}

class DatabaseOptimizer {
    private queryMetrics: QueryMetric[] = [];
    private queryCache = new Map<string, any>();
    private cacheStats = { hits: 0, misses: 0 };

    /**
     * Monitor and log query performance
     */
    async trackQuery<T>(
        queryFn: () => Promise<T>,
        queryName: string,
        userId?: string
    ): Promise<T> {
        const startTime = Date.now();
        const operation = this.detectOperation(queryName);

        try {
            const result = await queryFn();
            const duration = Date.now() - startTime;

            // Log metrics
            this.queryMetrics.push({
                query: queryName,
                duration,
                timestamp: startTime,
                userId,
                operation,
                recordCount: Array.isArray(result) ? result.length : 1,
            });

            // Log slow queries
            if (duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
                console.warn(`🐌 Slow Query (${duration}ms): ${queryName}`, {
                    userId,
                    duration,
                    operation,
                });
            }

            // Keep only recent metrics (last 1000 queries)
            if (this.queryMetrics.length > PERFORMANCE_THRESHOLDS.MAX_CACHE_SIZE) {
                this.queryMetrics = this.queryMetrics.slice(-500);
            }

            return result;
        } catch (error) {
            console.error(`❌ Query Failed: ${queryName}`, error);
            throw error;
        }
    }

    /**
     * Cache frequently used queries
     */
    async cachedQuery<T>(
        cacheKey: string,
        queryFn: () => Promise<T>,
        ttlMinutes: number = 5
    ): Promise<T> {
        const cached = this.queryCache.get(cacheKey);
        const now = Date.now();

        if (cached && cached.timestamp + (ttlMinutes * 60 * 1000) > now) {
            this.cacheStats.hits++;
            return cached.data;
        }

        this.cacheStats.misses++;
        const result = await queryFn();

        this.queryCache.set(cacheKey, {
            data: result,
            timestamp: now,
        });

        // Clear old cache entries
        if (this.queryCache.size > PERFORMANCE_THRESHOLDS.MAX_CACHE_SIZE) {
            const entries = Array.from(this.queryCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

            // Remove oldest 20%
            const toRemove = Math.floor(entries.length * 0.2);
            for (let i = 0; i < toRemove; i++) {
                this.queryCache.delete(entries[i][0]);
            }
        }

        return result;
    }

    /**
     * Get comprehensive database health report
     */
    async getDatabaseHealth(): Promise<DatabaseHealth> {
        const metrics = this.getPerformanceMetrics();
        const recommendations = this.generateRecommendations(metrics);

        // Check database connectivity and performance
        const dbStartTime = Date.now();
        try {
            await prisma.$queryRaw`SELECT 1`;
            const dbResponseTime = Date.now() - dbStartTime;

            if (dbResponseTime > PERFORMANCE_THRESHOLDS.VERY_SLOW_QUERY_MS) {
                recommendations.push('Database response time is critically slow');
            }
        } catch (error) {
            recommendations.push('Database connectivity issues detected');
        }

        const status = this.calculateHealthStatus(metrics, recommendations);

        return {
            status,
            metrics: {
                avgQueryTime: metrics.averageQueryTime,
                slowQueries: metrics.slowQueryCount,
                totalQueries: this.queryMetrics.length,
                cacheHitRate: this.getCacheHitRate(),
                activeConnections: 0, // Would need actual DB monitoring
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
                },
            },
            recommendations,
            slowQueries: this.getSlowQueries(),
            timestamp: Date.now(),
        };
    }

    /**
     * Get optimized queries for specific use cases
     */
    getOptimizedQueries() {
        return {
            // Personnel management with proper indexing
            getPersonnelWithFilters: async (filters: any) => {
                const where: any = { archived: false };

                if (filters.company) where.company = filters.company;
                if (filters.role) where.role = filters.role;
                if (filters.employeeType) where.employeeType = filters.employeeType;
                if (filters.hasContract !== undefined) where.hasContract = filters.hasContract;

                return await this.trackQuery(
                    () => prisma.user.findMany({
                        where,
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                            employeeType: true,
                            company: true,
                            status: true,
                            hasContract: true,
                            contractStatus: true,
                            lastLoginAt: true,
                            profileImage: true,
                        },
                        orderBy: [
                            { lastName: 'asc' },
                            { firstName: 'asc' }
                        ],
                    }),
                    'getPersonnelWithFilters'
                );
            },

            // Time tracking with optimized queries
            getTimeEntriesForPeriod: async (userId: string, startDate: Date, endDate: Date) => {
                return await this.trackQuery(
                    () => prisma.timeEntry.findMany({
                        where: {
                            userId,
                            startTime: { gte: startDate },
                            endTime: { lte: endDate },
                        },
                        include: {
                            project: {
                                select: {
                                    id: true,
                                    name: true,
                                    company: true,
                                },
                            },
                        },
                        orderBy: { startTime: 'desc' },
                    }),
                    'getTimeEntriesForPeriod',
                    userId
                );
            },

            // Schedule optimization
            getScheduleForWeek: async (startDate: Date, endDate: Date) => {
                return await this.trackQuery(
                    () => prisma.scheduleShift.findMany({
                        where: {
                            startTime: { gte: startDate },
                            endTime: { lte: endDate },
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    role: true,
                                    employeeType: true,
                                    profileImage: true,
                                },
                            },
                            project: {
                                select: {
                                    id: true,
                                    name: true,
                                    company: true,
                                },
                            },
                            workLocation: {
                                select: {
                                    id: true,
                                    name: true,
                                    address: true,
                                },
                            },
                        },
                        orderBy: [
                            { startTime: 'asc' },
                            { user: { lastName: 'asc' } }
                        ],
                    }),
                    'getScheduleForWeek'
                );
            },

            // Dashboard analytics
            getDashboardMetrics: async (userId: string) => {
                const cacheKey = `dashboard_metrics_${userId}`;

                return await this.cachedQuery(
                    cacheKey,
                    async () => {
                        const [
                            totalUsers,
                            activeProjects,
                            todayShifts,
                            pendingNotifications
                        ] = await Promise.all([
                            prisma.user.count({ where: { archived: false } }),
                            prisma.project.count({ where: { status: 'ACTIVE' } }),
                            prisma.scheduleShift.count({
                                where: {
                                    startTime: {
                                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                                        lt: new Date(new Date().setHours(23, 59, 59, 999)),
                                    },
                                },
                            }),
                            prisma.systemNotification.count({
                                where: {
                                    userId,
                                    read: false,
                                },
                            }),
                        ]);

                        return {
                            totalUsers,
                            activeProjects,
                            todayShifts,
                            pendingNotifications,
                        };
                    },
                    2 // Cache for 2 minutes
                );
            },
        };
    }

    /**
     * Analyze and suggest query optimizations
     */
    analyzeQueryPerformance() {
        const analysis = {
            totalQueries: this.queryMetrics.length,
            avgQueryTime: this.getAverageQueryTime(),
            slowQueries: this.getSlowQueries(),
            topSlowQueries: this.getTopSlowQueries(5),
            queryDistribution: this.getQueryDistribution(),
            recommendations: [] as string[],
        };

        // Generate performance recommendations
        if (analysis.avgQueryTime > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
            analysis.recommendations.push('Overall query performance is slow - consider adding more indexes');
        }

        if (analysis.slowQueries.length > analysis.totalQueries * 0.1) {
            analysis.recommendations.push('High percentage of slow queries detected');
        }

        const cacheHitRate = this.getCacheHitRate();
        if (cacheHitRate < 0.8) {
            analysis.recommendations.push('Low cache hit rate - consider caching more frequently used queries');
        }

        return analysis;
    }

    /**
     * Database cleanup and maintenance
     */
    async performMaintenance() {
        console.log('🧹 Starting database maintenance...');

        try {
            // Clean old activity logs (older than 90 days)
            const oldActivityCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            const deletedActivity = await prisma.activityFeed.deleteMany({
                where: {
                    createdAt: { lt: oldActivityCutoff },
                },
            });
            console.log(`✅ Cleaned ${deletedActivity.count} old activity records`);

            // Clean old security logs (older than 180 days)
            const oldSecurityCutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
            const deletedSecurity = await prisma.securityLog.deleteMany({
                where: {
                    createdAt: { lt: oldSecurityCutoff },
                },
            });
            console.log(`✅ Cleaned ${deletedSecurity.count} old security records`);

            // Clean expired user sessions
            const deletedSessions = await prisma.userSession.deleteMany({
                where: {
                    expiresAt: { lt: new Date() },
                },
            });
            console.log(`✅ Cleaned ${deletedSessions.count} expired sessions`);

            // Clean old read notifications (older than 30 days)
            const oldNotificationCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const deletedNotifications = await prisma.systemNotification.deleteMany({
                where: {
                    read: true,
                    readAt: { lt: oldNotificationCutoff },
                },
            });
            console.log(`✅ Cleaned ${deletedNotifications.count} old notifications`);

            console.log('✅ Database maintenance completed successfully');

            return {
                success: true,
                cleaned: {
                    activityRecords: deletedActivity.count,
                    securityRecords: deletedSecurity.count,
                    expiredSessions: deletedSessions.count,
                    oldNotifications: deletedNotifications.count,
                },
            };
        } catch (error) {
            console.error('❌ Database maintenance failed:', error);
            throw error;
        }
    }

    // Private helper methods
    private detectOperation(queryName: string): QueryMetric['operation'] {
        if (queryName.includes('find') || queryName.includes('get')) return 'SELECT';
        if (queryName.includes('create')) return 'INSERT';
        if (queryName.includes('update')) return 'UPDATE';
        if (queryName.includes('delete')) return 'DELETE';
        if (queryName.includes('upsert')) return 'UPSERT';
        return 'SELECT';
    }

    private getPerformanceMetrics() {
        const now = Date.now();
        const recentMetrics = this.queryMetrics.filter(
            m => now - m.timestamp < 60 * 60 * 1000 // Last hour
        );

        return {
            averageQueryTime: recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length || 0,
            slowQueryCount: recentMetrics.filter(m => m.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS).length,
            totalQueries: recentMetrics.length,
        };
    }

    private generateRecommendations(metrics: any): string[] {
        const recommendations = [];

        if (metrics.averageQueryTime > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
            recommendations.push('Add database indexes for frequently queried fields');
            recommendations.push('Consider query optimization and result caching');
        }

        if (metrics.slowQueryCount > 10) {
            recommendations.push('Optimize slow queries with better indexing');
        }

        const memoryUsage = process.memoryUsage();
        if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
            recommendations.push('High memory usage detected - consider optimizing data structures');
        }

        return recommendations;
    }

    private calculateHealthStatus(metrics: any, recommendations: string[]): DatabaseHealth['status'] {
        if (recommendations.length > 3 || metrics.averageQueryTime > PERFORMANCE_THRESHOLDS.VERY_SLOW_QUERY_MS) {
            return 'critical';
        }
        if (recommendations.length > 1 || metrics.averageQueryTime > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
            return 'warning';
        }
        return 'healthy';
    }

    private getCacheHitRate(): number {
        const total = this.cacheStats.hits + this.cacheStats.misses;
        return total > 0 ? this.cacheStats.hits / total : 0;
    }

    private getSlowQueries(): QueryMetric[] {
        return this.queryMetrics
            .filter(m => m.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10);
    }

    private getTopSlowQueries(limit: number): QueryMetric[] {
        return this.queryMetrics
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }

    private getAverageQueryTime(): number {
        if (this.queryMetrics.length === 0) return 0;
        return this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) / this.queryMetrics.length;
    }

    private getQueryDistribution() {
        const distribution: Record<string, number> = {};
        this.queryMetrics.forEach(m => {
            distribution[m.operation] = (distribution[m.operation] || 0) + 1;
        });
        return distribution;
    }

    // Clear metrics and cache
    clearMetrics() {
        this.queryMetrics = [];
        this.queryCache.clear();
        this.cacheStats = { hits: 0, misses: 0 };
    }
}

// Global instance
export const dbOptimizer = new DatabaseOptimizer();

// Export types
export type { QueryMetric, DatabaseHealth }; 