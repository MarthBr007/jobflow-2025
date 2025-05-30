import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import prisma from './prisma';
import { NextRequest } from 'next/server';

// Use Web Crypto API instead of Node.js crypto for Edge Runtime compatibility
const getCrypto = () => {
    if (typeof window !== 'undefined') {
        return window.crypto;
    }
    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
        return globalThis.crypto;
    }
    // Fallback for Node.js environment
    return require('crypto').webcrypto || require('crypto');
};

// 2FA Functions
export async function generate2FASecret(userId: string, email: string) {
    const secret = speakeasy.generateSecret({
        name: `JobFlow (${email})`,
        issuer: 'JobFlow 2025',
        length: 32,
    });

    // Store the secret in database
    await prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secret.base32 },
    });

    return {
        secret: secret.base32,
        qrCode: await QRCode.toDataURL(secret.otpauth_url!),
        manualEntryKey: secret.base32,
    };
}

export function verify2FAToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1, // Allow 1 step window for time drift
    });
}

export async function enable2FA(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorSecret: true },
    });

    if (!user?.twoFactorSecret) {
        throw new Error('2FA secret not found');
    }

    const isValid = verify2FAToken(user.twoFactorSecret, token);

    if (isValid) {
        // Generate backup codes
        const backupCodes = generateBackupCodes();

        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                backupCodes: JSON.stringify(backupCodes),
            },
        });

        // Log security event
        await logSecurityEvent(userId, 'TWO_FA_ENABLED', {
            message: '2FA enabled successfully',
        });

        return true;
    }

    return false;
}

export async function disable2FA(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
        return false;
    }

    const isValid = verify2FAToken(user.twoFactorSecret, token);

    if (isValid) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                backupCodes: JSON.stringify([]),
            },
        });

        await logSecurityEvent(userId, 'TWO_FA_DISABLED', {
            message: '2FA disabled',
        });

        return true;
    }

    return false;
}

export function generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
        // Generate 4 random bytes equivalent
        const array = new Uint8Array(4);
        getCrypto().getRandomValues(array);
        const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
        codes.push(hex.toUpperCase());
    }
    return codes;
}

export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { backupCodes: true },
    });

    if (!user?.backupCodes) {
        return false;
    }

    const codes = JSON.parse(user.backupCodes as string) as string[];
    const codeIndex = codes.indexOf(code.toUpperCase());

    if (codeIndex !== -1) {
        // Remove used backup code
        codes.splice(codeIndex, 1);

        await prisma.user.update({
            where: { id: userId },
            data: { backupCodes: JSON.stringify(codes) },
        });

        await logSecurityEvent(userId, 'BACKUP_CODE_USED', {
            message: 'Backup code used for authentication',
            remainingCodes: codes.length,
        });

        return true;
    }

    return false;
}

// Rate Limiting
interface RateLimitConfig {
    windowMs: number;
    maxAttempts: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(key: string, config: RateLimitConfig): boolean {
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

export async function handleFailedLogin(userId: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { loginAttempts: true, lockoutUntil: true },
    });

    if (!user) return;

    const attempts = user.loginAttempts + 1;
    const lockoutTime = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // 30 min lockout

    await prisma.user.update({
        where: { id: userId },
        data: {
            loginAttempts: attempts,
            lockoutUntil: lockoutTime,
        },
    });

    await logSecurityEvent(userId, 'FAILED_LOGIN', {
        attempts,
        ipAddress,
        lockoutUntil: lockoutTime,
    });
}

export async function resetLoginAttempts(userId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            loginAttempts: 0,
            lockoutUntil: null,
            lastLoginAt: new Date(),
        },
    });
}

export async function isAccountLocked(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lockoutUntil: true },
    });

    return user?.lockoutUntil ? new Date() < user.lockoutUntil : false;
}

// Security Logging
export async function logSecurityEvent(
    userId: string,
    action: string,
    details: any,
    request?: NextRequest
) {
    const ipAddress = request ? getClientIP(request) : undefined;
    const userAgent = request ? request.headers.get('user-agent') : undefined;

    await prisma.securityLog.create({
        data: {
            userId,
            action,
            details,
            ipAddress,
            userAgent,
        },
    });
}

export function getClientIP(request: NextRequest): string {
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

// Session Management
export async function createUserSession(
    userId: string,
    deviceInfo: any,
    ipAddress?: string
): Promise<string> {
    const sessionId = getCrypto().randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.userSession.create({
        data: {
            userId,
            sessionId,
            deviceInfo,
            ipAddress,
            expiresAt,
        },
    });

    return sessionId;
}

export async function invalidateUserSession(sessionId: string) {
    await prisma.userSession.update({
        where: { sessionId },
        data: { isActive: false },
    });
}

export async function cleanupExpiredSessions() {
    await prisma.userSession.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                { isActive: false },
            ],
        },
    });
}

// Device Trust
export async function addTrustedDevice(
    userId: string,
    deviceId: string,
    deviceName: string,
    deviceType?: string
) {
    await prisma.trustedDevice.upsert({
        where: { userId_deviceId: { userId, deviceId } },
        create: {
            userId,
            deviceId,
            deviceName,
            deviceType,
        },
        update: {
            lastUsed: new Date(),
            isActive: true,
        },
    });
}

export async function isTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    const device = await prisma.trustedDevice.findUnique({
        where: { userId_deviceId: { userId, deviceId } },
    });

    return device?.isActive ?? false;
}

// Password Security
export function generateStrongPassword(): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';

    // Ensure at least one character from each set
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < 16; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
} {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password should contain lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password should contain uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Password should contain numbers');

    if (/[^a-zA-Z\d]/.test(password)) score += 1;
    else feedback.push('Password should contain special characters');

    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    return {
        isValid: score >= 4,
        score,
        feedback,
    };
} 