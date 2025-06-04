import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Enhanced rate limiting with Redis-like functionality
const rateLimitStore = new Map<string, { count: number; resetTime: number; strikes: number }>();
const suspiciousIPs = new Set<string>();
const blockedIPs = new Set<string>();

interface RateLimitConfig {
    windowMs: number;
    maxAttempts: number;
    blockDuration?: number;
    maxStrikes?: number;
}

// Simple UUID generator
function generateRequestId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function cleanupRateLimitStore() {
    const now = Date.now();
    const keysToDelete: string[] = [];

    rateLimitStore.forEach((data, key) => {
        if (now > data.resetTime) {
            keysToDelete.push(key);
        }
    });

    keysToDelete.forEach(key => rateLimitStore.delete(key));
}

function rateLimit(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    cleanupRateLimitStore();

    const current = rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
            strikes: 0
        });
        return true;
    }

    if (current.count >= config.maxAttempts) {
        // Increment strikes for repeated violations
        current.strikes = (current.strikes || 0) + 1;

        // Block IP after multiple strikes
        if (config.maxStrikes && current.strikes >= config.maxStrikes) {
            const ip = key.split(':')[0];
            suspiciousIPs.add(ip);
            console.warn(`IP blocked due to repeated rate limit violations: ${ip}`);
        }

        return false;
    }

    current.count++;
    return true;
}

function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    if (cfConnectingIP) return cfConnectingIP.trim();
    if (forwarded) return forwarded.split(',')[0].trim();
    if (realIP) return realIP.trim();

    return 'unknown';
}

function isValidIP(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === '::1' || ip === 'unknown';
}

// Enhanced rate limit configurations
const rateLimitConfigs = {
    '/api/auth/login': {
        windowMs: 15 * 60 * 1000,
        maxAttempts: 5,
        maxStrikes: 3,
        blockDuration: 60 * 60 * 1000 // 1 hour
    },
    '/api/auth/register': {
        windowMs: 60 * 60 * 1000,
        maxAttempts: 3,
        maxStrikes: 2,
        blockDuration: 24 * 60 * 60 * 1000 // 24 hours
    },
    '/api/contracts': {
        windowMs: 60 * 1000,
        maxAttempts: 20,
        maxStrikes: 5
    },
    '/contract/sign': {
        windowMs: 5 * 60 * 1000,
        maxAttempts: 10,
        maxStrikes: 3
    },
    '/api/user/profile/image': {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 5, // 5 uploads per 15 minutes
        maxStrikes: 3
    },
    '/api/personnel/': {
        windowMs: 10 * 60 * 1000, // 10 minutes  
        maxAttempts: 10, // 10 document uploads per 10 minutes
        maxStrikes: 3
    },
    default: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
        maxAttempts: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        maxStrikes: 10
    },
};

export function middleware(request: NextRequest) {
    const clientIP = getClientIP(request);
    const path = request.nextUrl.pathname;
    const userAgent = request.headers.get('user-agent') || '';

    // Debug logging for IP issues
    console.log(`🔍 Middleware: Request from IP ${clientIP} to ${path}`);

    // Check if IP is blocked - but be less aggressive
    if (blockedIPs.has(clientIP)) {
        console.warn(`Blocked request from blocked IP: ${clientIP} to ${path}`);
        return new NextResponse(
            JSON.stringify({
                error: 'Access denied',
                message: 'Your IP has been blocked due to suspicious activity'
            }),
            {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    // Be more lenient with suspicious IPs for admin users
    if (suspiciousIPs.has(clientIP)) {
        console.warn(`Suspicious IP detected but allowing: ${clientIP} to ${path}`);
        // Don't block, just log - allow admin to work
    }

    // Validate IP format - but don't be too strict in production
    if (process.env.IP_VALIDATION_ENABLED === 'true' && !isValidIP(clientIP) && process.env.NODE_ENV !== 'production') {
        console.warn(`Invalid IP format detected: ${clientIP}`);
        // Only add to suspicious in development, not production
        suspiciousIPs.add(clientIP);
    }

    const response = NextResponse.next();

    // Enhanced security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }

    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' ws: wss:; frame-ancestors 'none';"
    );

    // Enhanced rate limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api/') || request.nextUrl.pathname.startsWith('/contract/sign')) {
        // Find matching rate limit config
        let config = rateLimitConfigs.default;
        for (const [pattern, patternConfig] of Object.entries(rateLimitConfigs)) {
            if (pattern !== 'default' && path.startsWith(pattern)) {
                config = patternConfig;
                break;
            }
        }

        const rateLimitKey = `${clientIP}:${path}`;

        if (!rateLimit(rateLimitKey, config)) {
            console.warn(`Rate limit exceeded for ${clientIP} on ${path}`);

            return new NextResponse(
                JSON.stringify({
                    error: 'Too many requests',
                    message: 'Rate limit exceeded. Please try again later.',
                    retryAfter: Math.ceil(config.windowMs / 1000),
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
                        'X-RateLimit-Limit': config.maxAttempts.toString(),
                        'X-RateLimit-Remaining': '0',
                    },
                }
            );
        }

        // Add rate limit headers
        const currentData = rateLimitStore.get(rateLimitKey);
        if (currentData) {
            response.headers.set('X-RateLimit-Limit', config.maxAttempts.toString());
            response.headers.set('X-RateLimit-Remaining', (config.maxAttempts - currentData.count).toString());
            response.headers.set('X-RateLimit-Reset', new Date(currentData.resetTime).toISOString());
        }
    }

    // Add request tracking
    const requestId = generateRequestId();
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Client-IP', clientIP);

    // Enhanced suspicious activity detection
    if (isSuspiciousRequest(request)) {
        const suspiciousData = {
            ip: clientIP,
            userAgent,
            path,
            requestId,
            timestamp: new Date().toISOString(),
            method: request.method,
            referer: request.headers.get('referer') || 'none',
        };

        console.warn('Suspicious request detected:', suspiciousData);

        // Log to audit trail if enabled
        if (process.env.AUDIT_LOGGING_ENABLED === 'true') {
            // In production, this would go to a proper logging service
            console.log('AUDIT:', JSON.stringify(suspiciousData));
        }

        suspiciousIPs.add(clientIP);
    }

    // Performance monitoring
    if (process.env.PERFORMANCE_MONITORING === 'true') {
        response.headers.set('X-Response-Time', Date.now().toString());
    }

    return response;
}

function isSuspiciousRequest(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || '';
    const path = request.nextUrl.pathname;
    const referer = request.headers.get('referer') || '';

    // Enhanced bot patterns
    const suspiciousPatterns = [
        /curl/i,
        /wget/i,
        /python/i,
        /bot/i,
        /crawler/i,
        /scanner/i,
        /nikto/i,
        /sqlmap/i,
        /nmap/i,
        /masscan/i,
    ];

    // Suspicious paths
    const suspiciousPaths = [
        '/wp-admin',
        '/admin',
        '/.env',
        '/config',
        '/backup',
        '/.git',
        '/database',
        '/phpmyadmin',
        '/xmlrpc.php',
        '/wp-config.php',
    ];

    // Suspicious query patterns
    const suspiciousQueries = [
        'union select',
        'script>',
        'javascript:',
        '../',
        'etc/passwd',
        'cmd.exe',
    ];

    // Whitelist admin API paths that are legitimate
    const adminApiPaths = [
        '/api/personnel/bulk-import',
        '/api/admin/',
        '/api/debug/',
        '/api/auth/',
    ];

    const queryString = request.nextUrl.search.toLowerCase();

    // Don't flag admin API calls as suspicious
    const isAdminApiCall = adminApiPaths.some(adminPath => path.startsWith(adminPath));
    if (isAdminApiCall) {
        return false;
    }

    return (
        suspiciousPatterns.some(pattern => pattern.test(userAgent)) ||
        suspiciousPaths.some(suspiciousPath => path.includes(suspiciousPath)) ||
        suspiciousQueries.some(query => queryString.includes(query)) ||
        (request.method === 'POST' && !referer && path.startsWith('/api/') && !isAdminApiCall)
    );
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}; 