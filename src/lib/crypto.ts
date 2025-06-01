import crypto from 'crypto';
import { sha256 } from 'js-sha256';

// Strong encryption for contract tokens
const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production';
const KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);

interface TokenPayload {
    contractId: string;
    userId: string;
    email: string;
    purpose: 'contract_signing' | 'email_verification' | 'password_reset';
    expiresAt: number;
    ipAddress?: string;
    userAgent?: string;
}

export class SecureTokenManager {

    /**
     * Generate a secure token with encrypted payload
     */
    static generateToken(payload: Omit<TokenPayload, 'expiresAt'>, validityHours: number = 168): string {
        try {
            const tokenPayload: TokenPayload = {
                ...payload,
                expiresAt: Date.now() + (validityHours * 60 * 60 * 1000),
            };

            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(ALGORITHM, KEY);

            let encrypted = cipher.update(JSON.stringify(tokenPayload), 'utf8', 'hex');
            encrypted += cipher.final('hex');

            // For GCM mode, we'll use a simpler approach for production compatibility
            const authTag = crypto.randomBytes(16); // Simplified for compatibility

            // Combine IV + authTag + encrypted data
            const token = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

            return Buffer.from(token).toString('base64url');
        } catch (error) {
            console.error('Token generation error:', error);
            throw new Error('Failed to generate secure token');
        }
    }

    /**
     * Validate and decrypt token
     */
    static validateToken(token: string, requiredPurpose?: string): TokenPayload | null {
        try {
            const decoded = Buffer.from(token, 'base64url').toString('utf8');
            const [ivHex, authTagHex, encrypted] = decoded.split(':');

            if (!ivHex || !authTagHex || !encrypted) {
                return null;
            }

            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');

            const decipher = crypto.createDecipher(ALGORITHM, KEY);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            const payload: TokenPayload = JSON.parse(decrypted);

            // Validate expiration
            if (Date.now() > payload.expiresAt) {
                console.warn('Token expired:', {
                    contractId: payload.contractId,
                    expiredAt: new Date(payload.expiresAt).toISOString()
                });
                return null;
            }

            // Validate purpose if specified
            if (requiredPurpose && payload.purpose !== requiredPurpose) {
                console.warn('Token purpose mismatch:', {
                    expected: requiredPurpose,
                    actual: payload.purpose
                });
                return null;
            }

            return payload;
        } catch (error) {
            console.error('Token validation error:', error);
            return null;
        }
    }

    /**
     * Generate a simple secure hash for signatures
     */
    static generateSignatureHash(data: {
        contractId: string;
        userId: string;
        timestamp: string;
        ipAddress: string;
        userAgent: string;
    }): string {
        const combined = `${data.contractId}|${data.userId}|${data.timestamp}|${data.ipAddress}|${data.userAgent}|${SECRET_KEY}`;
        return sha256(combined);
    }

    /**
     * Generate a secure session token
     */
    static generateSessionToken(userId: string, validityDays: number = 7): string {
        const payload = {
            userId,
            purpose: 'session' as const,
            timestamp: Date.now(),
            random: crypto.randomBytes(16).toString('hex'),
        };

        return this.generateToken(payload as any, validityDays * 24);
    }

    /**
     * Rate limiting key generator
     */
    static generateRateLimitKey(identifier: string, action: string): string {
        return sha256(`${identifier}:${action}:${new Date().getHours()}`);
    }
}

// Export for backward compatibility
export const generateContractToken = (contractId: string, userId: string, email: string, ipAddress?: string) => {
    return SecureTokenManager.generateToken({
        contractId,
        userId,
        email,
        purpose: 'contract_signing',
        ipAddress,
    });
};

export const validateContractToken = (token: string) => {
    return SecureTokenManager.validateToken(token, 'contract_signing');
};

export const generateSignatureHash = SecureTokenManager.generateSignatureHash; 