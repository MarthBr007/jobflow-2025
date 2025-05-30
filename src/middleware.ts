import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple rate limiting without external dependencies
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
    windowMs: number;
    maxAttempts: number;
}

function rateLimit(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const current = rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
        return true;
    }

    if (current.count >= config.maxAttempts) {
        return false;
    }

    current.count++;
    return true;
}

function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIP) {
        return realIP;
    }

    return 'unknown';
}

// Rate limit configurations for different endpoints
const rateLimitConfigs = {
    '/api/auth/login': { windowMs: 15 * 60 * 1000, maxAttempts: 5 }, // 5 attempts per 15 min
    '/api/auth/register': { windowMs: 60 * 60 * 1000, maxAttempts: 3 }, // 3 attempts per hour
    '/api/auth/2fa': { windowMs: 5 * 60 * 1000, maxAttempts: 10 }, // 10 attempts per 5 min
    default: { windowMs: 60 * 1000, maxAttempts: 100 }, // 100 requests per minute
};

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
    );
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' ws: wss:;"
    );

    // Rate limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const clientIP = getClientIP(request);
        const path = request.nextUrl.pathname;

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
            return new NextResponse(
                JSON.stringify({
                    error: 'Too many requests',
                    message: 'Rate limit exceeded. Please try again later.',
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': '60',
                    },
                }
            );
        }
    }

    // Add request ID for tracking
    const requestId = crypto.randomUUID();
    response.headers.set('X-Request-ID', requestId);

    // Log suspicious activity
    if (isSuspiciousRequest(request)) {
        console.warn(`Suspicious request detected: ${request.nextUrl.pathname}`, {
            ip: getClientIP(request),
            userAgent: request.headers.get('user-agent'),
            requestId,
        });
    }

    return response;
}

function isSuspiciousRequest(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || '';
    const path = request.nextUrl.pathname;

    // Common bot patterns
    const suspiciousPatterns = [
        /curl/i,
        /wget/i,
        /python/i,
        /bot/i,
        /crawler/i,
        /scanner/i,
    ];

    // Suspicious paths
    const suspiciousPaths = [
        '/wp-admin',
        '/admin',
        '/.env',
        '/config',
        '/backup',
    ];

    return (
        suspiciousPatterns.some(pattern => pattern.test(userAgent)) ||
        suspiciousPaths.some(suspiciousPath => path.includes(suspiciousPath))
    );
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}; 