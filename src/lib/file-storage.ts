import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream, createWriteStream, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export type StorageProvider = 'aws-s3' | 'local' | 'vercel-blob' | 'cloudflare-r2';

export interface StorageConfig {
    provider: StorageProvider;
    aws?: {
        region: string;
        bucketName: string;
        accessKeyId: string;
        secretAccessKey: string;
        endpoint?: string; // For R2 compatibility
    };
    local?: {
        basePath: string;
        publicUrl: string;
    };
    vercel?: {
        token: string;
    };
}

export interface FileMetadata {
    filename: string;
    size: number;
    contentType: string;
    lastModified?: Date;
    url?: string;
    signedUrl?: string;
}

export interface UploadResult {
    success: boolean;
    url?: string;
    filename?: string;
    error?: string;
    metadata?: FileMetadata;
}

export class CloudFileStorage {
    private config: StorageConfig;
    private s3Client?: S3Client;

    constructor() {
        this.config = this.loadConfig();
        this.initializeProviders();
    }

    private loadConfig(): StorageConfig {
        const provider = (process.env.STORAGE_PROVIDER as StorageProvider) || 'local';

        return {
            provider,
            aws: {
                region: process.env.AWS_REGION || 'eu-west-1',
                bucketName: process.env.AWS_S3_BUCKET || 'jobflow-contracts',
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
                endpoint: process.env.AWS_ENDPOINT, // For Cloudflare R2
            },
            local: {
                basePath: process.env.LOCAL_STORAGE_PATH || './storage/contracts',
                publicUrl: process.env.PUBLIC_STORAGE_URL || '/api/files',
            },
            vercel: {
                token: process.env.BLOB_READ_WRITE_TOKEN || '',
            },
        };
    }

    private initializeProviders(): void {
        if (this.config.provider === 'aws-s3' || this.config.provider === 'cloudflare-r2') {
            this.s3Client = new S3Client({
                region: this.config.aws?.region || 'eu-west-1',
                credentials: {
                    accessKeyId: this.config.aws?.accessKeyId || '',
                    secretAccessKey: this.config.aws?.secretAccessKey || '',
                },
                endpoint: this.config.aws?.endpoint, // For R2
            });
        }

        // Ensure local directory exists
        if (this.config.provider === 'local' && this.config.local?.basePath) {
            if (!existsSync(this.config.local.basePath)) {
                mkdirSync(this.config.local.basePath, { recursive: true });
            }
        }
    }

    /**
     * Upload file to cloud storage
     */
    async uploadFile(
        buffer: Buffer,
        filename: string,
        contentType: string = 'application/pdf',
        folder: string = 'contracts'
    ): Promise<UploadResult> {
        try {
            const key = `${folder}/${Date.now()}_${filename}`;

            switch (this.config.provider) {
                case 'aws-s3':
                case 'cloudflare-r2':
                    return await this.uploadToS3(buffer, key, contentType);
                case 'vercel-blob':
                    return await this.uploadToVercelBlob(buffer, key, contentType);
                case 'local':
                default:
                    return await this.uploadToLocal(buffer, key, contentType);
            }
        } catch (error) {
            console.error('File upload failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed',
            };
        }
    }

    /**
     * Upload to AWS S3 (or compatible)
     */
    private async uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<UploadResult> {
        if (!this.s3Client || !this.config.aws?.bucketName) {
            throw new Error('S3 client not configured');
        }

        const command = new PutObjectCommand({
            Bucket: this.config.aws.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ServerSideEncryption: 'AES256', // Enable encryption
            Metadata: {
                uploadedAt: new Date().toISOString(),
                service: 'jobflow-contracts',
            },
        });

        await this.s3Client.send(command);

        const url = this.config.aws.endpoint
            ? `${this.config.aws.endpoint}/${this.config.aws.bucketName}/${key}`
            : `https://${this.config.aws.bucketName}.s3.${this.config.aws.region}.amazonaws.com/${key}`;

        return {
            success: true,
            url,
            filename: key,
            metadata: {
                filename: key,
                size: buffer.length,
                contentType,
                url,
            },
        };
    }

    /**
     * Upload to Vercel Blob Storage
     */
    private async uploadToVercelBlob(buffer: Buffer, key: string, contentType: string): Promise<UploadResult> {
        if (!this.config.vercel?.token) {
            throw new Error('Vercel Blob token not configured');
        }

        const response = await fetch(`https://blob.vercel-storage.com/${key}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${this.config.vercel.token}`,
                'Content-Type': contentType,
            },
            body: buffer as any, // Buffer is supported but TypeScript types may not be updated
        });

        if (!response.ok) {
            throw new Error(`Vercel Blob upload failed: ${response.statusText}`);
        }

        const result = await response.json();

        return {
            success: true,
            url: result.url,
            filename: key,
            metadata: {
                filename: key,
                size: buffer.length,
                contentType,
                url: result.url,
            },
        };
    }

    /**
     * Upload to local storage
     */
    private async uploadToLocal(buffer: Buffer, key: string, contentType: string): Promise<UploadResult> {
        if (!this.config.local?.basePath) {
            throw new Error('Local storage path not configured');
        }

        const fullPath = join(this.config.local.basePath, key);
        const directory = join(this.config.local.basePath, key.split('/')[0]);

        // Ensure directory exists
        if (!existsSync(directory)) {
            mkdirSync(directory, { recursive: true });
        }

        // Write file
        const stream = createWriteStream(fullPath);
        stream.write(buffer);
        stream.end();

        const url = `${this.config.local.publicUrl}/${key}`;

        return {
            success: true,
            url,
            filename: key,
            metadata: {
                filename: key,
                size: buffer.length,
                contentType,
                url,
            },
        };
    }

    /**
     * Get file metadata
     */
    async getFileInfo(filename: string): Promise<FileMetadata | null> {
        try {
            switch (this.config.provider) {
                case 'aws-s3':
                case 'cloudflare-r2':
                    return await this.getS3FileInfo(filename);
                case 'local':
                    return await this.getLocalFileInfo(filename);
                default:
                    return null;
            }
        } catch (error) {
            console.error('Failed to get file info:', error);
            return null;
        }
    }

    /**
     * Get S3 file metadata
     */
    private async getS3FileInfo(filename: string): Promise<FileMetadata | null> {
        if (!this.s3Client || !this.config.aws?.bucketName) return null;

        try {
            const command = new HeadObjectCommand({
                Bucket: this.config.aws.bucketName,
                Key: filename,
            });

            const response = await this.s3Client.send(command);

            return {
                filename,
                size: response.ContentLength || 0,
                contentType: response.ContentType || 'application/octet-stream',
                lastModified: response.LastModified,
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Get local file metadata
     */
    private async getLocalFileInfo(filename: string): Promise<FileMetadata | null> {
        if (!this.config.local?.basePath) return null;

        const fullPath = join(this.config.local.basePath, filename);

        if (!existsSync(fullPath)) return null;

        const fs = require('fs');
        const stats = fs.statSync(fullPath);

        return {
            filename,
            size: stats.size,
            contentType: 'application/pdf', // Default for contracts
            lastModified: stats.mtime,
            url: `${this.config.local.publicUrl}/${filename}`,
        };
    }

    /**
     * Generate signed URL for secure file access
     */
    async getSignedUrl(filename: string, expiresIn: number = 3600): Promise<string | null> {
        try {
            switch (this.config.provider) {
                case 'aws-s3':
                case 'cloudflare-r2':
                    return await this.getS3SignedUrl(filename, expiresIn);
                case 'local':
                    // For local files, return direct URL (in production, implement token-based access)
                    return `${this.config.local?.publicUrl}/${filename}`;
                default:
                    return null;
            }
        } catch (error) {
            console.error('Failed to generate signed URL:', error);
            return null;
        }
    }

    /**
     * Generate S3 signed URL
     */
    private async getS3SignedUrl(filename: string, expiresIn: number): Promise<string | null> {
        if (!this.s3Client || !this.config.aws?.bucketName) return null;

        const command = new GetObjectCommand({
            Bucket: this.config.aws.bucketName,
            Key: filename,
        });

        return await getSignedUrl(this.s3Client, command, { expiresIn });
    }

    /**
     * Delete file from storage
     */
    async deleteFile(filename: string): Promise<boolean> {
        try {
            switch (this.config.provider) {
                case 'aws-s3':
                case 'cloudflare-r2':
                    return await this.deleteFromS3(filename);
                case 'local':
                    return await this.deleteFromLocal(filename);
                default:
                    return false;
            }
        } catch (error) {
            console.error('Failed to delete file:', error);
            return false;
        }
    }

    /**
     * Delete from S3
     */
    private async deleteFromS3(filename: string): Promise<boolean> {
        if (!this.s3Client || !this.config.aws?.bucketName) return false;

        const command = new DeleteObjectCommand({
            Bucket: this.config.aws.bucketName,
            Key: filename,
        });

        await this.s3Client.send(command);
        return true;
    }

    /**
     * Delete from local storage
     */
    private async deleteFromLocal(filename: string): Promise<boolean> {
        if (!this.config.local?.basePath) return false;

        const fullPath = join(this.config.local.basePath, filename);

        if (existsSync(fullPath)) {
            unlinkSync(fullPath);
            return true;
        }

        return false;
    }

    /**
     * Get storage configuration status
     */
    getStorageStatus(): {
        provider: StorageProvider;
        configured: boolean;
        features: string[];
        limits: Record<string, any>;
    } {
        const features: string[] = [];
        const limits: Record<string, any> = {};

        switch (this.config.provider) {
            case 'aws-s3':
                if (this.config.aws?.bucketName && this.config.aws?.accessKeyId) {
                    features.push('Unlimited Storage', 'Global CDN', 'Encryption', 'Versioning');
                    limits.maxFileSize = '5TB';
                    limits.monthlyRequests = 'Unlimited';
                }
                break;
            case 'cloudflare-r2':
                if (this.config.aws?.bucketName && this.config.aws?.accessKeyId) {
                    features.push('No Egress Fees', 'Global Edge', 'S3 Compatible');
                    limits.maxFileSize = '5TB';
                    limits.monthlyRequests = '10M free';
                }
                break;
            case 'vercel-blob':
                if (this.config.vercel?.token) {
                    features.push('Edge Network', 'Simple API', 'Fast Upload');
                    limits.maxFileSize = '100MB';
                    limits.monthlyStorage = '1GB free';
                }
                break;
            case 'local':
                features.push('No External Dependencies', 'Full Control');
                limits.maxFileSize = 'Disk Space';
                limits.backup = 'Manual Required';
                break;
        }

        return {
            provider: this.config.provider,
            configured: features.length > 0,
            features,
            limits,
        };
    }

    /**
     * Test storage configuration
     */
    async testStorage(): Promise<{
        provider: StorageProvider;
        success: boolean;
        uploadTime?: number;
        error?: string;
    }> {
        const testBuffer = Buffer.from('Test file content for JobFlow storage test');
        const testFilename = `test_${Date.now()}.txt`;
        const startTime = Date.now();

        try {
            // Test upload
            const uploadResult = await this.uploadFile(testBuffer, testFilename, 'text/plain', 'test');

            if (!uploadResult.success) {
                return {
                    provider: this.config.provider,
                    success: false,
                    error: uploadResult.error,
                };
            }

            // Test retrieval (if supported)
            const fileInfo = await this.getFileInfo(uploadResult.filename || testFilename);

            // Cleanup test file
            if (uploadResult.filename) {
                await this.deleteFile(uploadResult.filename);
            }

            return {
                provider: this.config.provider,
                success: true,
                uploadTime: Date.now() - startTime,
            };
        } catch (error) {
            return {
                provider: this.config.provider,
                success: false,
                error: error instanceof Error ? error.message : 'Test failed',
            };
        }
    }
}

// Export singleton instance
export const fileStorage = new CloudFileStorage();
export default fileStorage; 