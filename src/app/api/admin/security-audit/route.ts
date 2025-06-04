import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Only allow admins to access security audit
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check various security aspects
        const securityChecks = {
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),

            // Critical Security Checks
            production_safety: {
                is_production: process.env.NODE_ENV === 'production',
                setup_endpoint_disabled: process.env.NODE_ENV === 'production' || process.env.ALLOW_SETUP !== 'true',
                seed_endpoint_disabled: process.env.NODE_ENV === 'production' || process.env.ALLOW_SEEDING !== 'true',
                debug_mode_disabled: process.env.NODE_ENV === 'production',
                registration_disabled: process.env.ENABLE_REGISTRATION === 'false'
            },

            // Authentication Security
            auth_security: {
                nextauth_secret_set: !!process.env.NEXTAUTH_SECRET,
                nextauth_secret_length: process.env.NEXTAUTH_SECRET?.length || 0,
                nextauth_url_set: !!process.env.NEXTAUTH_URL,
                jwt_sessions_enabled: true // We use JWT by default
            },

            // Database Security
            database_security: {
                connection_ssl: process.env.DATABASE_URL?.includes('sslmode=require') || false,
                connection_secure: !process.env.DATABASE_URL?.includes('localhost') || process.env.NODE_ENV === 'development'
            },

            // Rate Limiting
            rate_limiting: {
                enabled: process.env.RATE_LIMIT_ENABLED === 'true',
                window_ms: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
                max_requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
            },

            // Feature Security
            feature_security: {
                ip_validation: process.env.IP_VALIDATION_ENABLED === 'true',
                audit_logging: process.env.AUDIT_LOGGING_ENABLED === 'true',
                file_uploads_secured: process.env.ENABLE_FILE_UPLOADS === 'true',
                performance_monitoring: process.env.PERFORMANCE_MONITORING === 'true'
            }
        };

        // Check for default/weak passwords
        const weakPasswordChecks = await checkForWeakPasswords();

        // Check admin users
        const adminUsers = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true, email: true, name: true, createdAt: true }
        });

        // Calculate security score
        const securityScore = calculateSecurityScore(securityChecks, weakPasswordChecks);

        // Generate recommendations
        const recommendations = generateSecurityRecommendations(securityChecks, weakPasswordChecks);

        return NextResponse.json({
            security_audit: {
                ...securityChecks,
                password_security: weakPasswordChecks,
                admin_users: {
                    count: adminUsers.length,
                    users: adminUsers.map(user => ({
                        email: user.email,
                        name: user.name,
                        created: user.createdAt
                    }))
                },
                security_score: securityScore,
                recommendations: recommendations
            }
        });

    } catch (error) {
        console.error('Security audit error:', error);
        return NextResponse.json(
            { error: 'Internal server error during security audit' },
            { status: 500 }
        );
    }
}

async function checkForWeakPasswords() {
    try {
        // Count users with potentially weak passwords (this is a simplified check)
        const totalUsers = await prisma.user.count();
        const recentUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            }
        });

        return {
            total_users: totalUsers,
            recent_users: recentUsers,
            should_change_defaults: process.env.NODE_ENV === 'production' && recentUsers > 0,
            recommendation: 'Force password change on first login for all users'
        };
    } catch (error) {
        return {
            error: 'Could not check password security',
            recommendation: 'Manually verify all user passwords'
        };
    }
}

function calculateSecurityScore(checks: any, passwordChecks: any): number {
    let score = 0;
    let maxScore = 0;

    // Production safety (40 points)
    maxScore += 40;
    if (checks.production_safety.setup_endpoint_disabled) score += 10;
    if (checks.production_safety.seed_endpoint_disabled) score += 10;
    if (checks.production_safety.debug_mode_disabled) score += 10;
    if (checks.production_safety.registration_disabled) score += 10;

    // Authentication (30 points)
    maxScore += 30;
    if (checks.auth_security.nextauth_secret_set) score += 10;
    if (checks.auth_security.nextauth_secret_length >= 32) score += 10;
    if (checks.auth_security.nextauth_url_set) score += 10;

    // Features (20 points)
    maxScore += 20;
    if (checks.feature_security.rate_limiting) score += 5;
    if (checks.feature_security.ip_validation) score += 5;
    if (checks.feature_security.audit_logging) score += 5;
    if (checks.feature_security.file_uploads_secured) score += 5;

    // Password security (10 points)
    maxScore += 10;
    if (!passwordChecks.should_change_defaults) score += 10;

    return Math.round((score / maxScore) * 100);
}

function generateSecurityRecommendations(checks: any, passwordChecks: any): string[] {
    const recommendations = [];

    // Critical issues first
    if (!checks.production_safety.setup_endpoint_disabled) {
        recommendations.push('🚨 CRITICAL: Disable setup endpoint in production');
    }
    if (!checks.production_safety.seed_endpoint_disabled) {
        recommendations.push('🚨 CRITICAL: Disable seed endpoint in production');
    }

    // Authentication issues
    if (!checks.auth_security.nextauth_secret_set) {
        recommendations.push('⚠️ HIGH: Set NEXTAUTH_SECRET environment variable');
    }
    if (checks.auth_security.nextauth_secret_length < 32) {
        recommendations.push('⚠️ HIGH: Use longer NEXTAUTH_SECRET (minimum 32 characters)');
    }

    // Security features
    if (!checks.feature_security.rate_limiting) {
        recommendations.push('📝 MEDIUM: Enable rate limiting');
    }
    if (!checks.feature_security.audit_logging) {
        recommendations.push('📝 MEDIUM: Enable audit logging');
    }

    // Password security
    if (passwordChecks.should_change_defaults) {
        recommendations.push('🔑 HIGH: Force password change for all users with default passwords');
    }

    // Database security
    if (!checks.database_security.connection_ssl && checks.environment === 'production') {
        recommendations.push('🔒 HIGH: Enable SSL for database connections in production');
    }

    if (recommendations.length === 0) {
        recommendations.push('✅ Great! No critical security issues found');
    }

    return recommendations;
} 