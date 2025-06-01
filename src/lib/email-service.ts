import sgMail from '@sendgrid/mail';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';

export type EmailProvider = 'sendgrid' | 'mailgun' | 'smtp';

export interface EmailConfig {
  provider: EmailProvider;
  sendgrid?: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
    fromEmail: string;
    fromName: string;
  };
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
  };
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType: string;
  }>;
  templateId?: string;
  templateData?: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: EmailProvider;
}

export class ProfessionalEmailService {
  private config: EmailConfig;
  private mailgunClient?: any;

  constructor() {
    this.config = this.loadConfig();
    this.initializeProviders();
  }

  private loadConfig(): EmailConfig {
    const provider = (process.env.EMAIL_PROVIDER as EmailProvider) || 'smtp';

    return {
      provider,
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY || '',
        fromEmail: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM || '',
        fromName: process.env.SENDGRID_FROM_NAME || 'JobFlow System',
      },
      mailgun: {
        apiKey: process.env.MAILGUN_API_KEY || '',
        domain: process.env.MAILGUN_DOMAIN || '',
        fromEmail: process.env.MAILGUN_FROM_EMAIL || process.env.SMTP_FROM || '',
        fromName: process.env.MAILGUN_FROM_NAME || 'JobFlow System',
      },
      smtp: {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        fromEmail: process.env.SMTP_FROM || '',
        fromName: 'JobFlow System',
      }
    };
  }

  private initializeProviders(): void {
    // Initialize SendGrid
    if (this.config.provider === 'sendgrid' && this.config.sendgrid?.apiKey) {
      sgMail.setApiKey(this.config.sendgrid.apiKey);
    }

    // Initialize Mailgun
    if (this.config.provider === 'mailgun' && this.config.mailgun?.apiKey) {
      const mailgun = new Mailgun(FormData);
      this.mailgunClient = mailgun.client({
        username: 'api',
        key: this.config.mailgun.apiKey,
      });
    }
  }

  /**
   * Send email using configured provider
   */
  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    try {
      switch (this.config.provider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(message);
        case 'mailgun':
          return await this.sendWithMailgun(message);
        case 'smtp':
        default:
          return await this.sendWithSMTP(message);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.config.provider,
      };
    }
  }

  /**
   * Send email with SendGrid
   */
  private async sendWithSendGrid(message: EmailMessage): Promise<EmailResult> {
    if (!this.config.sendgrid?.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const msg = {
      to: Array.isArray(message.to) ? message.to : [message.to],
      from: {
        email: this.config.sendgrid.fromEmail,
        name: this.config.sendgrid.fromName,
      },
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
        type: att.contentType,
        disposition: 'attachment',
      })),
      templateId: message.templateId,
      dynamicTemplateData: message.templateData,
    };

    const [response] = await sgMail.send(msg);

    return {
      success: true,
      messageId: response.headers['x-message-id'],
      provider: 'sendgrid',
    };
  }

  /**
   * Send email with Mailgun
   */
  private async sendWithMailgun(message: EmailMessage): Promise<EmailResult> {
    if (!this.mailgunClient || !this.config.mailgun?.domain) {
      throw new Error('Mailgun not properly configured');
    }

    const data = {
      from: `${this.config.mailgun.fromName} <${this.config.mailgun.fromEmail}>`,
      to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    };

    const response = await this.mailgunClient.messages.create(this.config.mailgun.domain, data);

    return {
      success: true,
      messageId: response.id,
      provider: 'mailgun',
    };
  }

  /**
   * Send email with SMTP (fallback)
   */
  private async sendWithSMTP(message: EmailMessage): Promise<EmailResult> {
    // Use existing SMTP implementation
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransporter({
      host: this.config.smtp?.host,
      port: this.config.smtp?.port,
      secure: this.config.smtp?.port === 465,
      auth: {
        user: this.config.smtp?.user,
        pass: this.config.smtp?.pass,
      },
    });

    const result = await transporter.sendMail({
      from: `${this.config.smtp?.fromName} <${this.config.smtp?.fromEmail}>`,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments,
    });

    return {
      success: true,
      messageId: result.messageId,
      provider: 'smtp',
    };
  }

  /**
   * Send contract signing email with template
   */
  async sendContractSigningEmail(
    recipientEmail: string,
    recipientName: string,
    contractTitle: string,
    signingUrl: string
  ): Promise<EmailResult> {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Contract Ondertekening</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .button { 
                display: inline-block; 
                background: #10b981; 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
            }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>JobFlow Contract System</h1>
            </div>
            <div class="content">
                <h2>Hallo ${recipientName},</h2>
                <p>Je hebt een nieuw contract ontvangen voor ondertekening:</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0;">📄 ${contractTitle}</h3>
                    <p style="margin: 0; color: #666;">Klik op de onderstaande knop om je contract te bekijken en te ondertekenen.</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${signingUrl}" class="button">Contract Bekijken & Ondertekenen</a>
                </div>

                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h4 style="margin: 0 0 10px 0;">BELANGRIJK:</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Deze link is 7 dagen geldig</li>
                        <li>Lees het contract zorgvuldig door voordat je ondertekent</li>
                        <li>Bij vragen kun je contact opnemen met HR</li>
                        <li>Na ondertekening ontvang je automatisch een kopie</li>
                    </ul>
                </div>

                <p style="margin-top: 30px;">
                    Als je de bovenstaande knop niet kunt gebruiken, kopieer dan deze link naar je browser:<br>
                    <small style="color: #666; word-break: break-all;">${signingUrl}</small>
                </p>
            </div>
            <div class="footer">
                <p>Dit is een geautomatiseerd bericht van het JobFlow systeem.<br>
                Antwoord niet op deze e-mail.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return await this.sendEmail({
      to: recipientEmail,
      subject: `Contract Ondertekening: ${contractTitle}`,
      html,
      text: `Hallo ${recipientName},\n\nJe hebt een nieuw contract ontvangen voor ondertekening: ${contractTitle}\n\nBekijk en onderteken hier: ${signingUrl}\n\nMet vriendelijke groet,\nJobFlow System`
    });
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<{
    provider: EmailProvider;
    success: boolean;
    error?: string;
  }> {
    try {
      const testEmail = process.env.TEST_EMAIL || 'test@example.com';

      const result = await this.sendEmail({
        to: testEmail,
        subject: 'JobFlow Email Service Test',
        html: '<h1>Test Email</h1><p>If you receive this, your email service is working correctly!</p>',
        text: 'Test Email - If you receive this, your email service is working correctly!'
      });

      return {
        provider: this.config.provider,
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      return {
        provider: this.config.provider,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    provider: EmailProvider;
    configured: boolean;
    features: string[];
  } {
    const features: string[] = [];

    switch (this.config.provider) {
      case 'sendgrid':
        if (this.config.sendgrid?.apiKey) {
          features.push('Templates', 'Analytics', 'High Deliverability', 'Webhooks');
        }
        break;
      case 'mailgun':
        if (this.config.mailgun?.apiKey && this.config.mailgun?.domain) {
          features.push('EU/US Regions', 'Logs', 'Analytics', 'Webhooks');
        }
        break;
      case 'smtp':
        if (this.config.smtp?.host) {
          features.push('Basic Email', 'Custom SMTP');
        }
        break;
    }

    return {
      provider: this.config.provider,
      configured: features.length > 0,
      features,
    };
  }
}

// Export singleton instance
export const emailService = new ProfessionalEmailService();
export default emailService; 