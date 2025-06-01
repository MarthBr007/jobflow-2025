export interface CDNConfig {
    provider: 'cloudflare' | 'aws-cloudfront' | 'vercel' | 'custom';
    domainName: string;
    enabled: boolean;
    staticAssets: string[];
    cacheMaxAge: number;
    compressionEnabled: boolean;
}

export class CDNManager {
    private static config: CDNConfig = {
        provider: (process.env.CDN_PROVIDER as any) || 'vercel',
        domainName: process.env.CDN_DOMAIN || process.env.APP_URL || '',
        enabled: process.env.CDN_ENABLED === 'true',
        staticAssets: [
            '/_next/static/',
            '/images/',
            '/icons/',
            '/favicon.ico',
            '/robots.txt',
            '/sitemap.xml'
        ],
        cacheMaxAge: parseInt(process.env.CDN_CACHE_MAX_AGE || '31536000'), // 1 year
        compressionEnabled: true
    };

    /**
     * Get optimized asset URL with CDN
     */
    static getAssetUrl(path: string): string {
        if (!this.config.enabled || !this.config.domainName) {
            return path;
        }

        // Check if asset should use CDN
        const shouldUseCDN = this.config.staticAssets.some(pattern =>
            path.startsWith(pattern)
        );

        if (!shouldUseCDN) {
            return path;
        }

        // Return CDN URL
        const cdnDomain = this.config.domainName.replace(/\/$/, '');
        return `${cdnDomain}${path}`;
    }

    /**
     * Configure Next.js asset prefix for CDN
     */
    static getNextConfig() {
        return {
            assetPrefix: this.config.enabled ? this.config.domainName : '',

            // Image optimization
            images: {
                domains: this.config.enabled ? [
                    new URL(this.config.domainName).hostname,
                    'localhost'
                ] : ['localhost'],
                deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
                imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
                formats: ['image/webp', 'image/avif'],
                minimumCacheTTL: this.config.cacheMaxAge,
            },

            // Compression
            compress: this.config.compressionEnabled,

            // Headers for caching
            async headers() {
                return [
                    {
                        source: '/_next/static/:path*',
                        headers: [
                            {
                                key: 'Cache-Control',
                                value: `public, max-age=${CDNManager.config.cacheMaxAge}, immutable`
                            }
                        ]
                    },
                    {
                        source: '/images/:path*',
                        headers: [
                            {
                                key: 'Cache-Control',
                                value: `public, max-age=${Math.floor(CDNManager.config.cacheMaxAge / 2)}`
                            }
                        ]
                    }
                ];
            }
        };
    }

    /**
     * Generate CDN setup instructions
     */
    static generateCDNInstructions(): string {
        return `
# CDN Setup Instructions for JobFlow

## Option 1: Vercel CDN (Automatic)
- Vercel automatically provides global CDN
- No additional configuration needed
- Edge caching in 35+ regions

## Option 2: Cloudflare CDN
1. Add domain to Cloudflare
2. Enable "Auto Minify" for CSS, JS, HTML
3. Set caching rules:
   - /_next/static/* - Cache Everything, Edge TTL: 1 year
   - /images/* - Cache Everything, Edge TTL: 1 month
4. Enable "Rocket Loader" for JavaScript optimization

## Option 3: AWS CloudFront
1. Create CloudFront distribution
2. Set origin to your domain
3. Configure behaviors:
   - /_next/static/* - TTL: 31536000 (1 year)
   - /images/* - TTL: 2592000 (1 month)
4. Enable Gzip compression

## Environment Variables:
CDN_ENABLED=true
CDN_PROVIDER=cloudflare
CDN_DOMAIN=https://cdn.yourdomain.com
CDN_CACHE_MAX_AGE=31536000

## Performance Benefits:
- 50-90% faster asset loading
- Reduced server load
- Better user experience globally
- Automatic compression and optimization
    `;
    }

    /**
     * Optimize images for CDN delivery
     */
    static optimizeImageUrl(src: string, options?: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'webp' | 'avif' | 'auto';
    }): string {
        if (!this.config.enabled) return src;

        const params = new URLSearchParams();

        if (options?.width) params.append('w', options.width.toString());
        if (options?.height) params.append('h', options.height.toString());
        if (options?.quality) params.append('q', options.quality.toString());
        if (options?.format) params.append('f', options.format);

        const optimizedUrl = this.getAssetUrl(src);
        return params.toString() ? `${optimizedUrl}?${params.toString()}` : optimizedUrl;
    }

    /**
     * Preload critical assets
     */
    static generatePreloadLinks(): string[] {
        const criticalAssets = [
            '/_next/static/css/app.css',
            '/_next/static/chunks/framework.js',
            '/_next/static/chunks/main.js',
        ];

        return criticalAssets.map(asset => {
            const url = this.getAssetUrl(asset);
            const type = asset.endsWith('.css') ? 'style' : 'script';
            return `<link rel="preload" href="${url}" as="${type}" />`;
        });
    }

    /**
     * Check CDN performance
     */
    static async testCDNPerformance(): Promise<{
        provider: string;
        responseTime: number;
        status: 'healthy' | 'degraded' | 'error';
    }> {
        const testUrl = this.getAssetUrl('/_next/static/chunks/framework.js');
        const startTime = Date.now();

        try {
            const response = await fetch(testUrl, { method: 'HEAD' });
            const responseTime = Date.now() - startTime;

            return {
                provider: this.config.provider,
                responseTime,
                status: response.ok ?
                    (responseTime < 200 ? 'healthy' : 'degraded') :
                    'error'
            };
        } catch (error) {
            return {
                provider: this.config.provider,
                responseTime: Date.now() - startTime,
                status: 'error'
            };
        }
    }
}

export default CDNManager; 