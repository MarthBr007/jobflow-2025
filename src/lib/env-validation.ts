interface RequiredEnvVars {
    DATABASE_URL: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_USER: string;
    SMTP_PASS: string;
    SMTP_FROM: string;
}

interface OptionalEnvVars {
    NODE_ENV?: string;
    APP_URL?: string;
    RATE_LIMIT_WINDOW_MS?: string;
    RATE_LIMIT_MAX_REQUESTS?: string;
    TOKEN_EXPIRY_HOURS?: string;
    SESSION_TIMEOUT_MINUTES?: string;
    CONTRACT_SIGNING_TOKEN_EXPIRY_DAYS?: string;
    IP_VALIDATION_ENABLED?: string;
    AUDIT_LOGGING_ENABLED?: string;
    LOG_LEVEL?: string;
    ENABLE_REQUEST_LOGGING?: string;
    PERFORMANCE_MONITORING?: string;
}

export class EnvironmentValidator {
    private static requiredVars: (keyof RequiredEnvVars)[] = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS',
        'SMTP_FROM',
    ];

    static validateEnvironment(): { isValid: boolean; errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check required variables
        for (const varName of this.requiredVars) {
            const value = process.env[varName];

            if (!value) {
                errors.push(`Missing required environment variable: ${varName}`);
            } else if (value.includes('change-in-production') || value.includes('fallback')) {
                warnings.push(`Environment variable ${varName} appears to be using a default/fallback value`);
            }
        }

        // Validate specific formats
        if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres')) {
            errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
        }

        if (process.env.SMTP_PORT && isNaN(Number(process.env.SMTP_PORT))) {
            errors.push('SMTP_PORT must be a valid number');
        }

        if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
            warnings.push('NEXTAUTH_SECRET should be at least 32 characters long for security');
        }

        // Production-specific checks
        if (process.env.NODE_ENV === 'production') {
            if (!process.env.NEXTAUTH_URL?.startsWith('https://')) {
                errors.push('NEXTAUTH_URL must use HTTPS in production');
            }

            if (process.env.NEXTAUTH_SECRET === 'your-super-secret-key-here-change-in-production') {
                errors.push('NEXTAUTH_SECRET must be changed from default value in production');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    static getEnvironmentInfo(): {
        environment: string;
        database: string;
        smtp: string;
        security: string;
        features: Record<string, boolean>;
    } {
        return {
            environment: process.env.NODE_ENV || 'development',
            database: process.env.DATABASE_URL ? 'Connected' : 'Not configured',
            smtp: process.env.SMTP_HOST ? `${process.env.SMTP_HOST}:${process.env.SMTP_PORT}` : 'Not configured',
            security: process.env.NEXTAUTH_SECRET ? 'Configured' : 'Not configured',
            features: {
                ipValidation: process.env.IP_VALIDATION_ENABLED === 'true',
                auditLogging: process.env.AUDIT_LOGGING_ENABLED === 'true',
                performanceMonitoring: process.env.PERFORMANCE_MONITORING === 'true',
                requestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
            },
        };
    }

    static logEnvironmentStatus(): void {
        const validation = this.validateEnvironment();
        const info = this.getEnvironmentInfo();

        console.log('\n🔍 Environment Validation Results:');
        console.log('=====================================');

        if (validation.isValid) {
            console.log('✅ All required environment variables are present');
        } else {
            console.log('❌ Environment validation failed:');
            validation.errors.forEach(error => console.log(`  - ${error}`));
        }

        if (validation.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            validation.warnings.forEach(warning => console.log(`  - ${warning}`));
        }

        console.log('\n📊 Environment Info:');
        console.log(`  Environment: ${info.environment}`);
        console.log(`  Database: ${info.database}`);
        console.log(`  SMTP: ${info.smtp}`);
        console.log(`  Security: ${info.security}`);

        console.log('\n🔧 Features:');
        Object.entries(info.features).forEach(([feature, enabled]) => {
            console.log(`  ${feature}: ${enabled ? '✅ Enabled' : '❌ Disabled'}`);
        });

        console.log('=====================================\n');
    }
}

// Auto-validate on import in development
if (process.env.NODE_ENV !== 'test') {
    const validation = EnvironmentValidator.validateEnvironment();

    if (!validation.isValid) {
        console.error('❌ Environment validation failed. Please check your .env file.');
        validation.errors.forEach(error => console.error(`  - ${error}`));

        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
} 