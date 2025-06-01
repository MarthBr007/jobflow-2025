import { NextRequest, NextResponse } from 'next/server';

export interface SSLConfig {
    forceHTTPS: boolean;
    hstsMaxAge: number;
    includeSubdomains: boolean;
    preload: boolean;
    certificatePath?: string;
    privateKeyPath?: string;
}

export class SSLManager {
    private static config: SSLConfig = {
        forceHTTPS: process.env.NODE_ENV === 'production',
        hstsMaxAge: 31536000, // 1 year
        includeSubdomains: true,
        preload: true,
        certificatePath: process.env.SSL_CERT_PATH,
        privateKeyPath: process.env.SSL_KEY_PATH,
    };

    /**
     * Force HTTPS redirect in production
     */
    static forceHTTPS(request: NextRequest): NextResponse | null {
        if (!this.config.forceHTTPS) return null;

        const url = request.nextUrl.clone();
        const host = request.headers.get('host');
        const proto = request.headers.get('x-forwarded-proto');

        // Check if request is not HTTPS
        if (proto !== 'https' && host && !host.includes('localhost')) {
            url.protocol = 'https:';
            url.host = host;

            console.log(`Redirecting HTTP to HTTPS: ${url.toString()}`);
            return NextResponse.redirect(url, 301);
        }

        return null;
    }

    /**
     * Apply security headers for HTTPS
     */
    static applySecurityHeaders(response: NextResponse): void {
        // Strict Transport Security
        const hstsValue = [
            `max-age=${this.config.hstsMaxAge}`,
            this.config.includeSubdomains ? 'includeSubDomains' : '',
            this.config.preload ? 'preload' : ''
        ].filter(Boolean).join('; ');

        response.headers.set('Strict-Transport-Security', hstsValue);

        // Enhanced security headers for HTTPS
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('X-XSS-Protection', '1; mode=block');

        // Content Security Policy for HTTPS
        response.headers.set(
            'Content-Security-Policy',
            [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https:",
                "connect-src 'self' https: wss:",
                "frame-ancestors 'none'",
                "upgrade-insecure-requests"
            ].join('; ')
        );

        // Permissions Policy
        response.headers.set(
            'Permissions-Policy',
            [
                'geolocation=()',
                'microphone=()',
                'camera=()',
                'midi=()',
                'encrypted-media=()'
            ].join(', ')
        );
    }

    /**
     * Check SSL certificate validity
     */
    static validateSSLConfig(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (process.env.NODE_ENV === 'production') {
            if (!process.env.NEXTAUTH_URL?.startsWith('https://')) {
                errors.push('NEXTAUTH_URL must use HTTPS in production');
            }

            if (!process.env.APP_URL?.startsWith('https://')) {
                errors.push('APP_URL must use HTTPS in production');
            }

            // Check for SSL certificates in custom deployment
            if (process.env.SSL_CERT_PATH && !this.checkFileExists(process.env.SSL_CERT_PATH)) {
                errors.push(`SSL certificate not found at: ${process.env.SSL_CERT_PATH}`);
            }

            if (process.env.SSL_KEY_PATH && !this.checkFileExists(process.env.SSL_KEY_PATH)) {
                errors.push(`SSL private key not found at: ${process.env.SSL_KEY_PATH}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private static checkFileExists(path: string): boolean {
        try {
            const fs = require('fs');
            return fs.existsSync(path);
        } catch {
            return false;
        }
    }

    /**
     * Generate SSL setup instructions
     */
    static generateSSLInstructions(): string {
        return `
# SSL Setup Instructions for JobFlow

## Option 1: Using Vercel (Recommended)
1. Deploy to Vercel: \`vercel --prod\`
2. Custom domain: \`vercel domains add yourdomain.com\`
3. SSL is automatically provisioned

## Option 2: Using Nginx + Let's Encrypt
1. Install Certbot: \`sudo apt install certbot python3-certbot-nginx\`
2. Get certificate: \`sudo certbot --nginx -d yourdomain.com\`
3. Configure Nginx proxy to Next.js on port 3000

## Option 3: Using Cloudflare
1. Add domain to Cloudflare
2. Set DNS to proxy (orange cloud)
3. Enable "Always Use HTTPS" in SSL/TLS settings

## Environment Variables for Production:
NEXTAUTH_URL=https://yourdomain.com
APP_URL=https://yourdomain.com
SSL_CERT_PATH=/path/to/certificate.crt (optional)
SSL_KEY_PATH=/path/to/private.key (optional)

## Testing SSL:
curl -I https://yourdomain.com
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
    `;
    }
}

export default SSLManager; 