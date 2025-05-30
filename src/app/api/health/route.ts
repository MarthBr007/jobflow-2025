import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    const startTime = Date.now();

    try {
        // Basic health check data
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'unknown',
            version: process.env.npm_package_version || '1.0.0',
            checks: {
                database: 'unknown',
                memory: 'unknown',
                disk: 'unknown'
            },
            responseTime: 0
        };

        // Database connectivity check
        try {
            await prisma.$queryRaw`SELECT 1`;
            healthData.checks.database = 'healthy';
        } catch (error) {
            healthData.checks.database = 'unhealthy';
            healthData.status = 'degraded';
        }

        // Memory usage check
        const memoryUsage = process.memoryUsage();
        const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

        if (memoryUsedMB < 500) {
            healthData.checks.memory = 'healthy';
        } else if (memoryUsedMB < 1000) {
            healthData.checks.memory = 'warning';
        } else {
            healthData.checks.memory = 'unhealthy';
            healthData.status = 'degraded';
        }

        // Add memory details
        (healthData as any).memory = {
            used: `${memoryUsedMB}MB`,
            total: `${memoryTotalMB}MB`,
            percentage: Math.round((memoryUsedMB / memoryTotalMB) * 100)
        };

        // Calculate response time
        healthData.responseTime = Date.now() - startTime;

        // Determine overall status
        if (healthData.checks.database === 'unhealthy') {
            healthData.status = 'unhealthy';
        } else if (healthData.checks.database === 'healthy' && healthData.checks.memory !== 'unhealthy') {
            healthData.status = 'healthy';
        }

        // Return appropriate status code
        const statusCode = healthData.status === 'healthy' ? 200 :
            healthData.status === 'degraded' ? 200 : 503;

        return NextResponse.json(healthData, { status: statusCode });

    } catch (error) {
        console.error('Health check failed:', error);

        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
            responseTime: Date.now() - startTime
        }, { status: 503 });
    }
}

// Detailed health check for internal monitoring
export async function POST() {
    const startTime = Date.now();

    try {
        const detailedHealth = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            system: {
                uptime: process.uptime(),
                platform: process.platform,
                nodeVersion: process.version,
                environment: process.env.NODE_ENV || 'unknown'
            },
            database: {
                status: 'unknown',
                responseTime: 0,
                connections: 0
            },
            memory: {
                used: 0,
                total: 0,
                percentage: 0,
                external: 0
            },
            performance: {
                totalResponseTime: 0
            }
        };

        // Database detailed check
        const dbStartTime = Date.now();
        try {
            // Test basic connectivity
            await prisma.$queryRaw`SELECT 1`;

            // Count active users (as a functional test)
            const userCount = await prisma.user.count();

            detailedHealth.database.status = 'healthy';
            detailedHealth.database.responseTime = Date.now() - dbStartTime;
            (detailedHealth.database as any).userCount = userCount;
        } catch (error) {
            detailedHealth.database.status = 'unhealthy';
            detailedHealth.database.responseTime = Date.now() - dbStartTime;
            detailedHealth.status = 'unhealthy';
        }

        // Memory detailed check
        const memoryUsage = process.memoryUsage();
        detailedHealth.memory = {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
            external: Math.round(memoryUsage.external / 1024 / 1024)
        };

        // Performance metrics
        detailedHealth.performance.totalResponseTime = Date.now() - startTime;

        // Additional system info
        (detailedHealth.system as any).pid = process.pid;
        (detailedHealth.system as any).arch = process.arch;

        return NextResponse.json(detailedHealth);

    } catch (error) {
        console.error('Detailed health check failed:', error);

        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Detailed health check failed',
            performance: {
                totalResponseTime: Date.now() - startTime
            }
        }, { status: 503 });
    }
} 