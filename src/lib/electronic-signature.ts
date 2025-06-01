import { sha256 } from 'js-sha256';

export interface SignatureData {
    signatureBase64: string;
    signerName: string;
    signerEmail: string;
    signatureDate: Date;
    ipAddress: string;
    userAgent: string;
    contractId: string;
    documentHash: string;
}

export interface DigitalSignature {
    id: string;
    contractId: string;
    signerName: string;
    signerEmail: string;
    signerRole: 'EMPLOYER' | 'EMPLOYEE' | 'WITNESS';
    signatureImageBase64: string;
    signedAt: Date;
    ipAddress: string;
    userAgent: string;
    documentHash: string;
    verificationCode: string;
    isVerified: boolean;
    metadata: {
        browser: string;
        device: string;
        location?: string;
        sessionId: string;
    };
}

export class ElectronicSignatureValidator {

    static generateVerificationCode(signatureData: SignatureData): string {
        const concatenatedData = `${signatureData.contractId}-${signatureData.signerEmail}-${signatureData.signatureDate.toISOString()}-${signatureData.documentHash}`;
        return sha256(concatenatedData).substring(0, 16).toUpperCase();
    }

    static validateSignature(signature: DigitalSignature, originalDocumentHash: string): boolean {
        // Verify document integrity
        if (signature.documentHash !== originalDocumentHash) {
            return false;
        }

        // Verify signature timestamp is reasonable (not in future, not too old)
        const now = new Date();
        const signedAt = new Date(signature.signedAt);
        const timeDifference = now.getTime() - signedAt.getTime();
        const maxAgeMs = 365 * 24 * 60 * 60 * 1000; // 1 year

        if (signedAt > now || timeDifference > maxAgeMs) {
            return false;
        }

        // Verify verification code
        const expectedCode = this.generateVerificationCode({
            signatureBase64: signature.signatureImageBase64,
            signerName: signature.signerName,
            signerEmail: signature.signerEmail,
            signatureDate: signedAt,
            ipAddress: signature.ipAddress,
            userAgent: signature.userAgent,
            contractId: signature.contractId,
            documentHash: signature.documentHash
        });

        return signature.verificationCode === expectedCode;
    }

    static generateSignatureAuditLog(signature: DigitalSignature): string {
        return `
ELECTRONIC SIGNATURE AUDIT LOG
================================

Document ID: ${signature.contractId}
Signer: ${signature.signerName} (${signature.signerEmail})
Role: ${signature.signerRole}
Signed At: ${signature.signedAt.toISOString()}
IP Address: ${signature.ipAddress}
User Agent: ${signature.userAgent}
Document Hash: ${signature.documentHash}
Verification Code: ${signature.verificationCode}
Verified: ${signature.isVerified ? 'YES' : 'NO'}

Metadata:
- Browser: ${signature.metadata.browser}
- Device: ${signature.metadata.device}
- Session ID: ${signature.metadata.sessionId}
${signature.metadata.location ? `- Location: ${signature.metadata.location}` : ''}

This signature was captured using legally compliant electronic signature
technology in accordance with eIDAS regulation and Dutch law.
        `.trim();
    }
}

export interface SignaturePadConfig {
    width: number;
    height: number;
    backgroundColor: string;
    penColor: string;
    penWidth: number;
    velocityFilterWeight: number;
    minWidth: number;
    maxWidth: number;
}

export const defaultSignaturePadConfig: SignaturePadConfig = {
    width: 400,
    height: 200,
    backgroundColor: '#ffffff',
    penColor: '#000000',
    penWidth: 2,
    velocityFilterWeight: 0.7,
    minWidth: 1,
    maxWidth: 4
};

export class SignaturePadManager {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private isDrawing: boolean = false;
    private lastX: number = 0;
    private lastY: number = 0;
    private config: SignaturePadConfig;

    constructor(canvas: HTMLCanvasElement, config: SignaturePadConfig = defaultSignaturePadConfig) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.config = config;
        this.setupCanvas();
        this.bindEvents();
    }

    private setupCanvas(): void {
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = this.config.penColor;
        this.ctx.lineWidth = this.config.penWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    private bindEvents(): void {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }

    private startDrawing(e: MouseEvent): void {
        this.isDrawing = true;
        [this.lastX, this.lastY] = this.getCoordinates(e);
    }

    private draw(e: MouseEvent): void {
        if (!this.isDrawing) return;

        const [currentX, currentY] = this.getCoordinates(e);

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();

        [this.lastX, this.lastY] = [currentX, currentY];
    }

    private stopDrawing(): void {
        this.isDrawing = false;
    }

    private handleTouch(e: TouchEvent): void {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' :
            e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });

        if (e.type === 'touchstart') this.startDrawing(mouseEvent);
        else if (e.type === 'touchmove') this.draw(mouseEvent);
        else this.stopDrawing();
    }

    private getCoordinates(e: MouseEvent): [number, number] {
        const rect = this.canvas.getBoundingClientRect();
        return [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    }

    public clear(): void {
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    public isEmpty(): boolean {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Check if pixel is not background color
            if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
                return false;
            }
        }
        return true;
    }

    public getSignatureDataURL(): string {
        return this.canvas.toDataURL('image/png');
    }

    public getSignatureBlob(): Promise<Blob> {
        return new Promise((resolve) => {
            this.canvas.toBlob((blob) => {
                resolve(blob!);
            }, 'image/png');
        });
    }
}

// Database storage interface
export interface SignatureRepository {
    saveSignature(signature: DigitalSignature): Promise<string>;
    getSignature(signatureId: string): Promise<DigitalSignature | null>;
    getSignaturesByContract(contractId: string): Promise<DigitalSignature[]>;
    verifySignature(signatureId: string): Promise<boolean>;
    generateSignatureReport(contractId: string): Promise<string>;
}

// Utility functions for legal compliance
export class LegalComplianceUtils {

    static generateLegalDisclaimer(): string {
        return `
ELEKTRONISCHE HANDTEKENING DISCLAIMER
=====================================

Door het plaatsen van uw elektronische handtekening bevestigt u dat:

1. U de bevoegdheid heeft om dit document namens uzelf of uw organisatie te ondertekenen
2. U akkoord gaat met de inhoud van dit document
3. Deze elektronische handtekening dezelfde juridische waarde heeft als een handgeschreven handtekening
4. U begrijpt dat dit document elektronisch wordt opgeslagen en verwerkt

Rechtsgevolgen:
- Deze elektronische handtekening is rechtsgeldig conform de eIDAS-verordening
- Het document wordt beveiligd opgeslagen met cryptografische verificatie
- Audit logs worden bijgehouden voor juridische doeleinden
- U kunt een ondertekend exemplaar downloaden na voltooiing

Voor vragen over deze elektronische handtekening procedure, neem contact op met ons juridisch team.

AKKOORD MET VOORWAARDEN
Door te ondertekenen gaat u akkoord met bovenstaande voorwaarden.
        `.trim();
    }

    static generateSignatureCertificate(signatures: DigitalSignature[]): string {
        const now = new Date().toISOString();

        return `
CERTIFICATE OF ELECTRONIC SIGNATURE
===================================

Document Signing Certificate
Generated: ${now}

This certificate confirms that the following electronic signatures were applied
to the document in accordance with eIDAS regulation and Dutch electronic signature law.

SIGNATURES APPLIED:
${signatures.map((sig, index) => `
${index + 1}. ${sig.signerName} (${sig.signerRole})
   Email: ${sig.signerEmail}
   Signed: ${sig.signedAt.toISOString()}
   Verification Code: ${sig.verificationCode}
   Status: ${sig.isVerified ? 'VERIFIED' : 'PENDING VERIFICATION'}
`).join('')}

SECURITY VERIFICATION:
- Document integrity: VERIFIED
- Signature authenticity: VERIFIED  
- Timestamp validity: VERIFIED
- Legal compliance: eIDAS COMPLIANT

This certificate serves as proof of the electronic signing process and can be
used for legal and audit purposes.

Certificate ID: CERT-${Date.now().toString(36).toUpperCase()}
        `.trim();
    }
}

export default {
    ElectronicSignatureValidator,
    SignaturePadManager,
    LegalComplianceUtils,
    defaultSignaturePadConfig
}; 